"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCcw, Loader2, AlertCircle, CheckCircle2, ChevronDown, User, Users } from "lucide-react";
import { useClasses, ApiClass } from "@/app/hooks/useClasses";
import { useTeachers } from "@/app/hooks/useTeachers";
import { useAuth } from "@/app/context/auth";
import { useAppState } from "@/app/context/store";

export default function ClassTeacherPage() {
  const { user } = useAuth();
  const { academicYear } = useAppState();
  const isAdmin = user?.role === "school_admin" || user?.role === "super_admin";

  const { classes, isLoading: classesLoading, fetchClasses, updateClass } = useClasses({ filterByYear: true });
  const { teachers, isLoading: teachersLoading } = useTeachers();

  const [searchTerm, setSearchTerm] = useState("");
  const [updatingClassId, setUpdatingClassId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTeacherChange = async (classId: string, teacherId: string) => {
    setUpdatingClassId(classId);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await updateClass(classId, {
        class_teacher_id: teacherId || undefined
      });
      if (res.success) {
        setSuccessMsg("Class teacher updated successfully!");
        fetchClasses({ academic_year: academicYear });
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.message || "Failed to update class teacher.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Network error.");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setUpdatingClassId(null);
    }
  };

  const filteredClasses = classes.filter(c => {
    const className = c.name.toLowerCase();
    const section = (c.section || "").toLowerCase();
    const classCode = (c.class_code || "").toLowerCase();
    const teacherName = (c.class_teacher_id?.name || "").toLowerCase();
    const q = searchTerm.toLowerCase();

    return className.includes(q) || section.includes(q) || classCode.includes(q) || teacherName.includes(q);
  });

  const isLoading = classesLoading || teachersLoading;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] leading-[24px] font-bold text-foreground dark:text-slate-100">Class Teacher Assignment</h1>
          <div className="flex items-center gap-2 text-[14px] text-[#68718a] mt-1 font-medium">
            <span>Academic Management</span><span>/</span>
            <span className="text-foreground dark:text-slate-100">Class Teacher</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchClasses({ academic_year: academicYear })}
            className="p-2 border border-border rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4">
        <p className="text-[13px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
          <strong>ℹ Class Teacher:</strong> Assign a teacher as the primary class teacher for a class. A teacher can be assigned to multiple classes. Class teachers can mark attendance and manage records for their assigned classes.
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-xl card-shadow">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
            Class Teacher List {!isLoading && <span className="ml-2 text-[13px] font-normal text-slate-400">({filteredClasses.length})</span>}
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search classes..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-border rounded-lg text-[13px] outline-none w-full sm:w-64 focus:border-primary/50 transition-colors shadow-sm bg-[#F8FAFC] dark:bg-[var(--sidebar-bg)] text-slate-700 dark:text-slate-200" 
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[14px] font-medium">Loading class teachers...</span>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-[14px] font-medium">No classes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Code</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Section</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Class Teacher</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assign Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredClasses.map((cls) => (
                  <tr key={cls._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[12px] text-slate-500 dark:text-slate-400">
                      {cls.class_code || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.section || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      {cls.class_teacher_id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {cls.class_teacher_id.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{cls.class_teacher_id.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <div className="relative inline-block w-64">
                          <select
                            disabled={updatingClassId === cls._id}
                            value={cls.class_teacher_id?._id || ""}
                            onChange={(e) => handleTeacherChange(cls._id, e.target.value)}
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary appearance-none bg-white dark:bg-slate-900 font-medium shadow-sm pr-8 cursor-pointer disabled:opacity-50"
                          >
                            <option value="">-- Choose Teacher --</option>
                            {teachers.map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                          {updatingClassId === cls._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary absolute right-3 top-2.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[13px]">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating status alerts (Toasts) */}
      {successMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[3]" />
          <span className="text-[13px] font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-600 text-white shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[3]" />
          <span className="text-[13px] font-medium">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
