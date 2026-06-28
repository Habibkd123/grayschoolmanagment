/**
 * useUpload – uploads a File to /api/upload and returns the saved URL.
 * Returns `{ uploading, uploadFile }`.
 */
import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/utils/session";

export function useUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { 
        method: "POST", 
        headers: getAuthHeaders(),
        body: form 
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Upload failed");
        return null;
      }
      return data.url as string; // e.g. /uploads/filename.jpg
    } catch (err) {
      alert("Upload failed. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, uploadFile };
}
