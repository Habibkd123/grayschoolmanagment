"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Search, RefreshCcw, Trash2, Edit, Loader2, AlertCircle,
  Link2, ChevronDown, Filter, BookOpen, Layers, GraduationCap
} from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { DataTable, ColumnDef } from "@/app/components/ui/data-table";
import { useSubjectAssignment, PopulatedAssignment } from "@/app/hooks/useSubjectAssignment";
import { useSubjectMaster } from "@/app/hooks/useSubjectMaster";
import { useStreams } from "@/app/hooks/useStreams";
import { useClasses } from "@/app/hooks/useClasses";
import { useAcademicConfig } from "@/app/hooks/useAcademicConfig";
import { useAuth } from "@/app/context/auth";
import { useAppState } from "@/app/context/store";

const ACADEMIC_YEARS = ["2026-2027"];

interface GroupedAssignment {
  key: string;
  class_id: { _id: string; name: string; class_code?: string; section?: string };
  stream_id?: { _id: string; name: string } | null;
  academic_year: string;
  subjects: { assignmentId: string; subjectId: string; name: string; subject_code?: string }[];
}

export default function SubjectAssignmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "school_admin" || user?.role === "super_admin";
  const { academicYear } = useAppState();
  const { enableStreams } = useAcademicConfig();

  const { assignments, isLoading, error, total, fetchAssignments, createAssignment, deleteAssignment } = useSubjectAssignment();
  const { subjects: subjectList } = useSubjectMaster();
  const { streams } = useStreams({ skip: !enableStreams });
  const { classes } = useClasses({ filterByYear: true });

  // Filter state
  const [filterClassId, setFilterClassId] = useState("");
  const [filterStreamId, setFilterStreamId] = useState("");
  const [filterYear, setFilterYear] = useState(academicYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedAssignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form
  const [formYear, setFormYear] = useState(academicYear);
  const [formClassId, setFormClassId] = useState("");
  const [formStreamId, setFormStreamId] = useState("");
  const [formSubjectIds, setFormSubjectIds] = useState<string[]>([]);
  const [initialSubjectIds, setInitialSubjectIds] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");

  const doFetch = useCallback(() => {
    fetchAssignments({
      class_id: filterClassId || undefined,
      stream_id: filterStreamId || undefined,
      academic_year: filterYear || undefined,
      limit: 100,
    });
  }, [fetchAssignments, filterClassId, filterStreamId, filterYear]);

  useEffect(() => { doFetch(); }, [doFetch]);

  // Trigger auto stream selection on class select
  useEffect(() => {
    if (!formClassId || !enableStreams) {
      setFormStreamId("");
      return;
    }
    const selectedClass = classes.find(c => c._id === formClassId);
    if (!selectedClass) {
      setFormStreamId("");
      return;
    }

    const isHigherClass = selectedClass.name.startsWith("Class 11") || selectedClass.name.startsWith("Class 12");
    if (!isHigherClass) {
      setFormStreamId("");
      return;
    }

    const activeStreams = streams.filter(s => s.status === "Active");
    let foundStreamId = "";
    for (const stream of activeStreams) {
      const escapedStreamName = stream.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedStreamName}\\b`, 'i');
      if (regex.test(selectedClass.name)) {
        foundStreamId = stream._id;
        break;
      }
    }
    setFormStreamId(foundStreamId);
  }, [formClassId, classes, streams, enableStreams]);

  const filteredStreams = useMemo(() => {
    if (!enableStreams || !formClassId) return [];

    const selectedClass = classes.find(c => c._id === formClassId);
    if (!selectedClass) return [];

    const isHigherClass = selectedClass.name.startsWith("Class 11") || selectedClass.name.startsWith("Class 12");
    if (!isHigherClass) return [];

    const activeStreams = streams.filter(s => s.status === "Active");
    const matchedStreams = activeStreams.filter(stream => {
      const escapedStreamName = stream.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedStreamName}\\b`, 'i');
      return regex.test(selectedClass.name);
    });

    if (matchedStreams.length > 0) {
      return matchedStreams;
    }

    return activeStreams;
  }, [formClassId, classes, streams, enableStreams]);

  // Strict stream filtering based on SubjectMaster allowed_streams
  const filteredSubjectList = useMemo(() => {
    const selectedClass = classes.find(c => c._id === formClassId);
    const isHigherClass = selectedClass ? (selectedClass.name.startsWith("Class 11") || selectedClass.name.startsWith("Class 12")) : false;

    if (!enableStreams || !formStreamId || !isHigherClass) return subjectList;

    return subjectList.filter(s => {
      // Common subject (not restricted to any stream)
      if (!s.allowed_streams || s.allowed_streams.length === 0) return true;
      // Stream-specific subject
      return s.allowed_streams.includes(formStreamId);
    });
  }, [subjectList, formStreamId, enableStreams, formClassId, classes]);

  const resetForm = () => {
    setFormYear(academicYear);
    setFormClassId("");
    setFormStreamId("");
    setFormSubjectIds([]);
    setInitialSubjectIds([]);
    setFormError("");
    setSubjectSearch("");
    setSelectedGroup(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formYear || !formClassId) {
      setFormError("Academic year and class are required."); return;
    }
    if (formSubjectIds.length === 0) {
      setFormError("Please select at least one subject."); return;
    }

    const selectedClass = classes.find(c => c._id === formClassId);
    const isHigherClass = selectedClass ? (selectedClass.name.startsWith("Class 11") || selectedClass.name.startsWith("Class 12")) : false;
    const streamVal = enableStreams && isHigherClass && formStreamId ? formStreamId : undefined;

    setSubmitting(true);
    let hasError = false;
    let errorMsg = "";

    for (const subId of formSubjectIds) {
      // Stream-conflict check: subject must not already be assigned to a DIFFERENT stream for same class+year
      if (enableStreams && streamVal) {
        const conflict = assignments.find(a => {
          const aSubjectId = typeof a.subject_master_id === "object" ? a.subject_master_id?._id : a.subject_master_id;
          const aClassId = typeof a.class_id === "object" ? a.class_id._id : a.class_id;
          const aStreamId = typeof a.stream_id === "object" ? a.stream_id?._id : a.stream_id;
          return (
            aSubjectId === subId &&
            aClassId === formClassId &&
            a.academic_year === formYear &&
            aStreamId != null &&
            aStreamId !== streamVal
          );
        });
        if (conflict) {
          const conflictStreamName = typeof conflict.stream_id === "object" ? conflict.stream_id?.name : conflict.stream_id;
          const selectedSubjectName = subjectList.find(s => s._id === subId)?.name || "This subject";
          const selectedStreamName = streams.find(s => s._id === streamVal)?.name || "selected stream";
          setFormError(
            `"${selectedSubjectName}" is already assigned to the ${conflictStreamName} stream for this class. It cannot be added to ${selectedStreamName} as well.`
          );
          setSubmitting(false);
          return;
        }
      }

      const res = await createAssignment({
        academic_year: formYear,
        class_id: formClassId,
        stream_id: streamVal,
        subject_master_id: subId,
      });

      if (!res.success) {
        hasError = true;
        errorMsg = res.message;
      }
    }

    setSubmitting(false);
    if (!hasError) {
      setIsAddOpen(false); resetForm(); doFetch();
    } else {
      setFormError(errorMsg || "Failed to assign some subjects.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    if (formSubjectIds.length === 0) {
      setFormError("Please select at least one subject."); return;
    }

    setSubmitting(true);
    const toAdd = formSubjectIds.filter(id => !initialSubjectIds.includes(id));
    const toDelete = selectedGroup.subjects.filter(s => !formSubjectIds.includes(s.subjectId));

    let hasError = false;
    let errorMsg = "";

    // Delete removed assignments
    for (const item of toDelete) {
      const res = await deleteAssignment(item.assignmentId);
      if (!res.success) {
        hasError = true;
        errorMsg = res.message;
      }
    }

    // Add new assignments
    const selectedClass = classes.find(c => c._id === formClassId);
    const isHigherClass = selectedClass ? (selectedClass.name.startsWith("Class 11") || selectedClass.name.startsWith("Class 12")) : false;
    const streamVal = enableStreams && isHigherClass && formStreamId ? formStreamId : undefined;

    for (const subId of toAdd) {
      const res = await createAssignment({
        academic_year: formYear,
        class_id: formClassId,
        stream_id: streamVal,
        subject_master_id: subId,
      });
      if (!res.success) {
        hasError = true;
        errorMsg = res.message;
      }
    }

    setSubmitting(false);
    if (!hasError) {
      setIsEditOpen(false); resetForm(); doFetch();
    } else {
      setFormError(errorMsg || "Failed to update assignments.");
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setSubmitting(true);
    let hasError = false;
    let errorMsg = "";
    for (const s of selectedGroup.subjects) {
      const res = await deleteAssignment(s.assignmentId);
      if (!res.success) {
        hasError = true;
        errorMsg = res.message;
      }
    }
    setSubmitting(false);
    setIsDeleteOpen(false);
    setSelectedGroup(null);
    doFetch();
  };

  const openEdit = (group: GroupedAssignment) => {
    setSelectedGroup(group);
    setFormYear(group.academic_year);
    setFormClassId(group.class_id._id);
    setFormStreamId(group.stream_id?._id || "");
    const subjectIds = group.subjects.map(s => s.subjectId);
    setFormSubjectIds(subjectIds);
    setInitialSubjectIds(subjectIds);
    setFormError("");
    setSubjectSearch("");
    setIsEditOpen(true);
  };

  // Group assignments by class + stream + academic_year
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, GroupedAssignment> = {};
    assignments.forEach(a => {
      if (!a.class_id) return;
      const classId = a.class_id._id;
      const streamId = a.stream_id?._id || "common";
      const key = `${classId}-${streamId}-${a.academic_year}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          class_id: a.class_id,
          stream_id: a.stream_id,
          academic_year: a.academic_year,
          subjects: [],
        };
      }
      groups[key].subjects.push({
        assignmentId: a._id,
        subjectId: a.subject_master_id?._id,
        name: a.subject_master_id?.name || "—",
        subject_code: a.subject_master_id?.subject_code,
      });
    });
    return Object.values(groups);
  }, [assignments]);

  // Filter displayed grouped assignments by search
  const filteredGroupedAssignments = groupedAssignments.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesClass = g.class_id?.name?.toLowerCase().includes(q) || (g.class_id?.section?.toLowerCase().includes(q) ?? false);
    const matchesStream = g.stream_id?.name?.toLowerCase().includes(q) ?? false;
    const matchesSubject = g.subjects.some(s => s.name?.toLowerCase().includes(q) || (s.subject_code?.toLowerCase().includes(q) ?? false));
    return matchesClass || matchesStream || matchesSubject;
  });

  // Filter subject options in modals by search input
  const modalFilteredSubjectList = useMemo(() => {
    return filteredSubjectList.filter(s => {
      if (!subjectSearch) return true;
      const q = subjectSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.subject_code?.toLowerCase().includes(q) ?? false);
    });
  }, [filteredSubjectList, subjectSearch]);

  const columns: ColumnDef<GroupedAssignment>[] = [
    { header: "#", accessorKey: "key", render: () => <span className="text-slate-400 text-[13px]">—</span> },
    { header: "Academic Year", accessorKey: "academic_year", render: (g) => (
      <span className="font-mono text-[12px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{g.academic_year}</span>
    )},
    { header: "Class", accessorKey: "class_id", render: (g) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center"><GraduationCap className="w-3.5 h-3.5 text-blue-500" /></div>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {g.class_id?.name}{g.class_id?.section ? ` - ${g.class_id.section}` : ""}
        </span>
      </div>
    )},
    ...(enableStreams ? [{
      header: "Stream", accessorKey: "stream_id",
      render: (g: GroupedAssignment) => g.stream_id ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-500/10 rounded flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-purple-500" /></div>
          <span className="font-medium text-slate-700 dark:text-slate-300">{g.stream_id.name}</span>
        </div>
      ) : <span className="text-slate-400 text-[13px] italic">—</span>,
    } as ColumnDef<GroupedAssignment>] : []),
    { header: "Assigned Subjects", accessorKey: "subjects", render: (g) => (
      <div className="flex flex-wrap gap-1.5 max-w-xl">
        {g.subjects.map(s => (
          <span key={s.subjectId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            {s.name} {s.subject_code ? `(${s.subject_code})` : ""}
          </span>
        ))}
        {g.subjects.length === 0 && <span className="text-slate-400 text-[13px] italic">No subjects assigned</span>}
      </div>
    )},
    ...(isAdmin ? [{
      header: "Action", sortable: false, className: "text-center",
      render: (g: GroupedAssignment) => (
        <div className="flex items-center gap-2 justify-center">
          <button onClick={() => openEdit(g)}
            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => { setSelectedGroup(g); setIsDeleteOpen(true); }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    } as ColumnDef<GroupedAssignment>] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-[20px] leading-[24px] font-bold text-foreground dark:text-slate-100">Subject Assignment</h1>
          <div className="flex items-center gap-2 text-[14px] text-[#68718a] mt-1 font-medium">
            <span>Academic Management</span><span>/</span>
            <span className="text-foreground dark:text-slate-100">Subject Assignment</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={doFetch} className="p-2 border border-border rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm">
            <RefreshCcw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[var(--primary-hover)] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors">
              <Plus className="w-4 h-4" /><span>Assign Subjects</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-xl p-4 card-shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Academic Year</label>
            <div className="relative">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium">
                <option value="">All Years</option>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Class</label>
            <div className="relative">
              <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ""}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
          {enableStreams && (
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Stream</label>
              <div className="relative">
                <select value={filterStreamId} onChange={(e) => setFilterStreamId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium">
                  <option value="">All Streams</option>
                  {streams.filter(s => s.status === "Active").map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" placeholder="Search classes, streams or subjects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-border rounded-lg text-[13px] outline-none w-full focus:border-primary/50 transition-colors bg-[#F8FAFC] dark:bg-[var(--sidebar-bg)]" />
            </div>
          </div>
          <button onClick={doFetch}
            className="px-4 py-2 bg-primary hover:bg-[var(--primary-hover)] text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 h-[38px]">
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-xl card-shadow">
        <div className="p-5 border-b border-border text-left">
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
            Assigned Subjects List {!isLoading && <span className="ml-2 text-[13px] font-normal text-slate-400">({filteredGroupedAssignments.length} groups)</span>}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-[14px] font-medium">Loading assignments...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle className="w-6 h-6" /><p className="text-[14px] font-medium">{error}</p>
          </div>
        ) : filteredGroupedAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Link2 className="w-10 h-10 opacity-30" />
            <p className="text-[14px] font-medium">No subject assignments found</p>
            <p className="text-[12px] text-slate-400">Assign subjects to classes to get started</p>
            {isAdmin && (
              <button onClick={() => { resetForm(); setIsAddOpen(true); }} className="px-4 py-2 text-[13px] font-bold bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg">
                Assign First Subject
              </button>
            )}
          </div>
        ) : (
          <DataTable columns={columns} data={filteredGroupedAssignments}
            selectionHeader={<input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" />}
            renderSelection={() => <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" />}
          />
        )}
      </div>

      {/* Add Assignment Modal */}
      <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); resetForm(); }} title="Assign Subjects">
        <form onSubmit={handleAdd} className="space-y-5 text-left">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground dark:text-slate-100">Academic Year <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={formYear} onChange={(e) => setFormYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium shadow-sm">
                  <option value="">Select Year</option>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground dark:text-slate-100">Class <span className="text-red-500">*</span></label>
              <div className="relative">
                <select value={formClassId} onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium shadow-sm">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ""}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {enableStreams && filteredStreams.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground dark:text-slate-100">
                Stream <span className="text-slate-400 text-[11px]">(optional — leave blank for all streams)</span>
              </label>
              <div className="relative">
                <select value={formStreamId} onChange={(e) => setFormStreamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 appearance-none bg-white dark:bg-slate-900 font-medium shadow-sm">
                  <option value="">No specific stream</option>
                  {filteredStreams.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground dark:text-slate-100">Select Subjects <span className="text-red-500">*</span></label>
            
            {/* Subjects search */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" placeholder="Search subjects list..." value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary bg-white dark:bg-slate-900" />
            </div>

            <div className="border border-border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-[#F8FAFC] dark:bg-slate-900/50">
              {modalFilteredSubjectList.filter(s => s.status === "Active").map(s => {
                const checked = formSubjectIds.includes(s._id);
                return (
                  <label key={s._id} className="flex items-center gap-2.5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-[13px] font-medium text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormSubjectIds([...formSubjectIds, s._id]);
                        } else {
                          setFormSubjectIds(formSubjectIds.filter(id => id !== s._id));
                        }
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" />
                    <span>{s.name} {s.subject_code ? `(${s.subject_code})` : ""}</span>
                  </label>
                );
              })}
              {modalFilteredSubjectList.filter(s => s.status === "Active").length === 0 && (
                <div className="text-center py-4 text-slate-400 italic text-[13px]">
                  No active subjects found.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => { setIsAddOpen(false); resetForm(); }}
              className="px-5 py-2.5 bg-[#F1F5F9] dark:bg-slate-800 text-foreground dark:text-slate-100 text-[14px] font-bold rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 bg-primary hover:bg-[var(--primary-hover)] text-[14px] font-bold rounded-lg text-white shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Assign Subjects
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); resetForm(); }} title="Edit Subject Assignment">
        <form onSubmit={handleEdit} className="space-y-5 text-left">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-400">Academic Year</label>
              <input type="text" value={formYear} disabled
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-400">Class</label>
              <input type="text" disabled
                value={classes.find(c => c._id === formClassId) ? `${classes.find(c => c._id === formClassId)?.name}${classes.find(c => c._id === formClassId)?.section ? ` - ${classes.find(c => c._id === formClassId)?.section}` : ""}` : ""}
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium" />
            </div>
          </div>

          {enableStreams && formStreamId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-400">Stream</label>
              <input type="text" value={streams.find(s => s._id === formStreamId)?.name || ""} disabled
                className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground dark:text-slate-100">Select Subjects <span className="text-red-500">*</span></label>
            
            {/* Subjects search */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" placeholder="Search subjects list..." value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary bg-white dark:bg-slate-900" />
            </div>

            <div className="border border-border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-[#F8FAFC] dark:bg-slate-900/50">
              {modalFilteredSubjectList.filter(s => s.status === "Active").map(s => {
                const checked = formSubjectIds.includes(s._id);
                return (
                  <label key={s._id} className="flex items-center gap-2.5 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-[13px] font-medium text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormSubjectIds([...formSubjectIds, s._id]);
                        } else {
                          setFormSubjectIds(formSubjectIds.filter(id => id !== s._id));
                        }
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" />
                    <span>{s.name} {s.subject_code ? `(${s.subject_code})` : ""}</span>
                  </label>
                );
              })}
              {modalFilteredSubjectList.filter(s => s.status === "Active").length === 0 && (
                <div className="text-center py-4 text-slate-400 italic text-[13px]">
                  No active subjects found.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => { setIsEditOpen(false); resetForm(); }}
              className="px-5 py-2.5 bg-[#F1F5F9] dark:bg-slate-800 text-foreground dark:text-slate-100 text-[14px] font-bold rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 bg-primary hover:bg-[var(--primary-hover)] text-[14px] font-bold rounded-lg text-white shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Remove Assignments">
        <div className="space-y-5 text-left">
          <p className="text-[14px] text-slate-600 dark:text-slate-300">
            Remove all assigned subjects from class <span className="font-bold text-foreground dark:text-white">{selectedGroup?.class_id?.name}</span>
            {selectedGroup?.stream_id && <> ({selectedGroup.stream_id.name})</>}?
            This will delete {selectedGroup?.subjects.length} assignment record(s).
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-2.5 bg-[#F1F5F9] dark:bg-slate-800 text-foreground dark:text-slate-100 text-[14px] font-bold rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={submitting} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[14px] font-bold rounded-lg shadow-sm disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Remove All
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

