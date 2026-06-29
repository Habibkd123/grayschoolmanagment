"use client";

import React, { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, CheckCircle2, FileText } from "lucide-react";
import { getAccessToken } from "@/lib/utils/session";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string; // e.g. "image/*" or "application/pdf"
  placeholder?: string;
  hint?: string;
}

export function FileUploadField({
  label,
  value,
  onChange,
  accept = "image/*",
  placeholder = "https://...",
  hint,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"url" | "upload">("url");

  const isPdf = accept.includes("pdf");
  const isImage = accept.includes("image");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const token = getAccessToken();
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json();
      if (json.success) {
        onChange(json.url);
        setMode("url");
      } else {
        setError(json.message || "Upload failed");
      }
    } catch (err: any) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = () => {
    onChange("");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border w-fit mb-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
            mode === "url"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-border"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent"
          }`}
        >
          <Link2 className="w-3.5 h-3.5" /> URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
            mode === "upload"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-border"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* URL mode */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-white dark:bg-slate-900 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-all shadow-sm"
          />
          {value && (
            <button
              type="button"
              onClick={clear}
              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`file-upload-${label.replace(/\s+/g, "-")}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/\s+/g, "-")}`}
            className={`flex items-center justify-center gap-3 w-full p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              uploading
                ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 cursor-not-allowed"
                : "border-border hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 dark:hover:bg-slate-800/40"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                <span className="text-[13px] text-[var(--primary)] font-medium">Uploading...</span>
              </>
            ) : (
              <>
                {isPdf ? <FileText className="w-5 h-5 text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
                <div className="text-center">
                  <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">Click to upload</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {hint || (isPdf ? "PDF up to 5MB" : "Images up to 5MB")}
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] text-rose-500 mt-1">{error}</p>
      )}

      {/* Preview if value exists */}
      {value && (
        <div className="mt-2 flex items-center gap-2">
          {value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || (value.startsWith("/uploads/images") || (!isPdf && isImage)) ? (
            <div className="relative group">
              <img
                src={value}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : value.match(/\.pdf$/i) || value.startsWith("/uploads/pdfs") ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              <a href={value} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--primary)] hover:underline font-medium">
                View PDF
              </a>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{value}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={clear}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
