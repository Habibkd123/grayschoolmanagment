"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Globe, CheckCircle2, AlertCircle,
  Plus, Trash2, HelpCircle, Star, Sparkles, Trophy, BarChart2,
  School, Image, MessageSquare, LayoutList, Building2
} from "lucide-react";
import { FileUploadField } from "../../../components/ui/FileUploadField";

interface HighlightItem { _id?: string; value: string; label: string; icon: string; }
interface FeatureItem { _id?: string; title: string; desc: string; icon: string; }
interface FacilityItem { _id?: string; title: string; icon: string; }
interface TestimonialItem { _id?: string; name: string; role: string; content: string; img: string; }
interface FAQItem { _id?: string; question: string; answer: string; }
interface HeroStatItem { _id?: string; value: string; label: string; icon: string; }

interface EditorData {
  hero_tagline: string;
  hero_description: string;
  hero_image_url: string;
  hero_side_image_url: string;
  hero_video_url: string;
  founded_year: number;
  hero_stats: HeroStatItem[];
  affiliation_name: string;
  affiliation_number: string;
  school_code: string;
  recognition_tags: string;
  admission_year_label: string;
  highlights: HighlightItem[];
  why_choose_us: FeatureItem[];
  facilities: FacilityItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
}

const defaultData: EditorData = {
  hero_tagline: "", hero_description: "", hero_image_url: "",
  hero_side_image_url: "", hero_video_url: "", founded_year: 0,
  hero_stats: [], affiliation_name: "", affiliation_number: "",
  school_code: "", recognition_tags: "", admission_year_label: "",
  highlights: [], why_choose_us: [], facilities: [], testimonials: [], faqs: [],
};

const SUGGESTED_ICONS = [
  "Monitor", "Users", "FlaskConical", "Trophy", "Laptop", "ShieldCheck",
  "MonitorPlay", "TestTube2", "Library", "Bus", "Mic2", "Music",
  "Presentation", "BookOpen", "GraduationCap", "Heart", "Star", "Target",
  "Building2", "Beaker", "Leaf", "Globe", "Award", "Zap"
];

// Shared styling helper constants using standard border-border, bg-white, and text-foreground
const inputCls = "w-full bg-white dark:bg-slate-900 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-foreground dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-all shadow-sm";
const smInputCls = "w-full bg-white dark:bg-slate-900 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-all shadow-sm";
const labelCls = "text-[12px] font-semibold text-slate-500 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block";
const sectionBox = "rounded-2xl border border-border bg-white dark:bg-slate-900/40 p-6 space-y-5 shadow-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

type TabId = "hero" | "school_info" | "highlights" | "features" | "facilities" | "testimonials" | "faq";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "hero", label: "Hero Banner", icon: <Image className="w-3.5 h-3.5" /> },
  { id: "school_info", label: "School Info", icon: <School className="w-3.5 h-3.5" /> },
  { id: "highlights", label: "Stats Highlights", icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: "features", label: "Why Choose Us", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "facilities", label: "Facilities", icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: "testimonials", label: "Testimonials", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "faq", label: "FAQs", icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

export default function LandingEditorPage() {
  const [data, setData] = useState<EditorData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [tab, setTab] = useState<TabId>("hero");

  useEffect(() => {
    const token = localStorage.getItem("sm_access_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/landing", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const doc = res.data;
          setData({
            hero_tagline: doc.about?.hero_tagline || "",
            hero_description: doc.about?.hero_description || "",
            hero_image_url: doc.about?.hero_image_url || "",
            hero_side_image_url: doc.about?.hero_side_image_url || "",
            hero_video_url: doc.about?.hero_video_url || "",
            founded_year: doc.about?.founded_year || 0,
            hero_stats: doc.about?.hero_stats?.length > 0 ? doc.about.hero_stats : [],
            affiliation_name: doc.about?.affiliation_name || "",
            affiliation_number: doc.about?.affiliation_number || "",
            school_code: doc.about?.school_code || "",
            recognition_tags: (doc.about?.recognition_tags || []).join(", "),
            admission_year_label: doc.about?.admission_year_label || "",
            highlights: doc.highlights?.length > 0 ? doc.highlights : [],
            why_choose_us: doc.why_choose_us?.length > 0 ? doc.why_choose_us : [],
            facilities: doc.facilities?.length > 0 ? doc.facilities : [],
            testimonials: doc.testimonials?.length > 0 ? doc.testimonials : [],
            faqs: doc.faqs?.length > 0 ? doc.faqs : [],
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setStatus("idle");
    try {
      const token = localStorage.getItem("sm_access_token");
      const res = await fetch("/api/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          section: "raw",
          data: {
            "about.hero_tagline": data.hero_tagline,
            "about.hero_description": data.hero_description,
            "about.hero_image_url": data.hero_image_url,
            "about.hero_side_image_url": data.hero_side_image_url,
            "about.hero_video_url": data.hero_video_url,
            "about.founded_year": data.founded_year || undefined,
            "about.hero_stats": data.hero_stats,
            "about.affiliation_name": data.affiliation_name,
            "about.affiliation_number": data.affiliation_number,
            "about.school_code": data.school_code,
            "about.recognition_tags": data.recognition_tags
              ? data.recognition_tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            "about.admission_year_label": data.admission_year_label,
            highlights: data.highlights,
            why_choose_us: data.why_choose_us,
            facilities: data.facilities,
            testimonials: data.testimonials,
            faqs: data.faqs,
          }
        }),
      });
      const json = await res.json();
      setStatus(json.success ? "success" : "error");
    } catch { setStatus("error"); }
    finally { setSaving(false); setTimeout(() => setStatus("idle"), 3000); }
  };

  const addHeroStat = () => setData((p) => ({ ...p, hero_stats: [...p.hero_stats, { value: "", label: "", icon: "Users" }] }));
  const removeHeroStat = (i: number) => setData((p) => ({ ...p, hero_stats: p.hero_stats.filter((_, idx) => idx !== i) }));
  const updateHeroStat = (i: number, f: keyof HeroStatItem, v: string) =>
    setData((p) => ({ ...p, hero_stats: p.hero_stats.map((s, idx) => idx === i ? { ...s, [f]: v } : s) }));

  const addHighlight = () => setData((p) => ({ ...p, highlights: [...p.highlights, { value: "", label: "", icon: "Star" }] }));
  const removeHighlight = (i: number) => setData((p) => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }));
  const updateHighlight = (i: number, f: keyof HighlightItem, v: string) =>
    setData((p) => ({ ...p, highlights: p.highlights.map((h, idx) => idx === i ? { ...h, [f]: v } : h) }));

  const addFeature = () => setData((p) => ({ ...p, why_choose_us: [...p.why_choose_us, { icon: "Sparkles", title: "", desc: "" }] }));
  const removeFeature = (i: number) => setData((p) => ({ ...p, why_choose_us: p.why_choose_us.filter((_, idx) => idx !== i) }));
  const updateFeature = (i: number, f: keyof FeatureItem, v: string) =>
    setData((p) => ({ ...p, why_choose_us: p.why_choose_us.map((fe, idx) => idx === i ? { ...fe, [f]: v } : fe) }));

  const addFacility = () => setData((p) => ({ ...p, facilities: [...p.facilities, { icon: "Star", title: "" }] }));
  const removeFacility = (i: number) => setData((p) => ({ ...p, facilities: p.facilities.filter((_, idx) => idx !== i) }));
  const updateFacility = (i: number, f: keyof FacilityItem, v: string) =>
    setData((p) => ({ ...p, facilities: p.facilities.map((fac, idx) => idx === i ? { ...fac, [f]: v } : fac) }));

  const addTestimonial = () => setData((p) => ({ ...p, testimonials: [...p.testimonials, { name: "", role: "", content: "", img: "" }] }));
  const removeTestimonial = (i: number) => setData((p) => ({ ...p, testimonials: p.testimonials.filter((_, idx) => idx !== i) }));
  const updateTestimonial = (i: number, f: keyof TestimonialItem, v: string) =>
    setData((p) => ({ ...p, testimonials: p.testimonials.map((t, idx) => idx === i ? { ...t, [f]: v } : t) }));

  const addFAQ = () => setData((p) => ({ ...p, faqs: [...p.faqs, { question: "", answer: "" }] }));
  const removeFAQ = (i: number) => setData((p) => ({ ...p, faqs: p.faqs.filter((_, idx) => idx !== i) }));
  const updateFAQ = (i: number, f: keyof FAQItem, v: string) =>
    setData((p) => ({ ...p, faqs: p.faqs.map((faq, idx) => idx === i ? { ...faq, [f]: v } : faq) }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" /></div>;

  const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="text-center py-10 text-slate-600 dark:text-slate-500 text-[13px] border border-dashed border-border rounded-xl flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-900/20">
      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-500 dark:text-slate-400 border border-border">{icon}</div>
      {text}
    </div>
  );

  const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[12px] font-bold hover:bg-[var(--primary)]/20 transition-colors">
      <Plus className="w-3.5 h-3.5" /> {label}
    </button>
  );

  const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="p-1.5 text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0">
      <Trash2 className="w-4 h-4" />
    </button>
  );

  const IconSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Field label="Icon (Lucide Name)">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={smInputCls}>
        {SUGGESTED_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
      </select>
    </Field>
  );

  return (
    <div className="space-y-6 max-w-4xl text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/website" className="p-2 border border-border rounded-lg bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-50 dark:bg-slate-800/50 shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground dark:text-slate-100">Homepage Landing Editor</h1>
            <p className="text-slate-500 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400 text-[13px] mt-0.5">Manage all content displayed on your root landing page</p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] hover:opacity-95 disabled:opacity-60 text-white text-[13px] font-bold transition-all shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Status banners */}
      {status === "success" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium">
          <CheckCircle2 className="w-4 h-4" /> Homepage layout saved successfully!
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px] font-medium">
          <AlertCircle className="w-4 h-4" /> Failed to save content. Please try again.
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-border rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              tab === t.id
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow border border-border"
                : "text-slate-600 dark:text-slate-500 hover:text-slate-850 dark:hover:text-slate-200"
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Hero Banner ── */}
      {tab === "hero" && (
        <div className={sectionBox}>
          <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] border-b border-border pb-3 flex items-center gap-2">
            <Image className="w-4.5 h-4.5 text-[var(--primary)]" /> Homepage Hero Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Hero Tagline">
              <input type="text" value={data.hero_tagline}
                onChange={(e) => setData({ ...data, hero_tagline: e.target.value })}
                placeholder="e.g. Excellence in Education & Character"
                className={inputCls} />
            </Field>
            <Field label="Founded Year">
              <input type="number" value={data.founded_year || ""}
                onChange={(e) => setData({ ...data, founded_year: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 1999"
                className={inputCls} />
            </Field>
          </div>
          <Field label="Hero Description / Introduction">
            <textarea value={data.hero_description}
              onChange={(e) => setData({ ...data, hero_description: e.target.value })}
              placeholder="Brief description of the school shown below the tagline..."
              rows={3} className={inputCls + " resize-none"} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileUploadField label="Background Image" value={data.hero_image_url}
              onChange={(v) => setData({ ...data, hero_image_url: v })}
              accept="image/*" placeholder="Hero background wallpaper..." />
            <FileUploadField label="Side Image Overlay" value={data.hero_side_image_url}
              onChange={(v) => setData({ ...data, hero_side_image_url: v })}
              accept="image/*" placeholder="Graphic/photo next to description..." />
          </div>
          <FileUploadField label="Virtual Campus Tour Video (Link or Upload)"
            value={data.hero_video_url}
            onChange={(v) => setData({ ...data, hero_video_url: v })}
            accept="video/*" placeholder="Paste YouTube link or upload direct MP4..." />
        </div>
      )}

      {/* ── Tab: School Info ── */}
      {tab === "school_info" && (
        <div className={sectionBox}>
          <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] border-b border-border pb-3 flex items-center gap-2">
            <School className="w-4.5 h-4.5 text-[var(--primary)]" /> School Info (shown in Hero &amp; Footer)
          </h2>

          {/* Affiliation */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">Affiliation &amp; Recognition</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Affiliation Board (e.g. CBSE)">
                <input type="text" value={data.affiliation_name}
                  onChange={(e) => setData({ ...data, affiliation_name: e.target.value })}
                  placeholder="e.g. CBSE" className={inputCls} />
              </Field>
              <Field label="Affiliation Number">
                <input type="text" value={data.affiliation_number}
                  onChange={(e) => setData({ ...data, affiliation_number: e.target.value })}
                  placeholder="e.g. 1234567" className={inputCls} />
              </Field>
              <Field label="School Code">
                <input type="text" value={data.school_code}
                  onChange={(e) => setData({ ...data, school_code: e.target.value })}
                  placeholder="e.g. 98765" className={inputCls} />
              </Field>
            </div>
            <Field label="Recognition Tags (comma separated — shown at bottom of hero)">
              <input type="text" value={data.recognition_tags}
                onChange={(e) => setData({ ...data, recognition_tags: e.target.value })}
                placeholder="e.g. CBSE Board, ISO Certified, NAAC Accredited"
                className={inputCls} />
            </Field>
            <Field label="Admission Year Label (for Footer CTA)">
              <input type="text" value={data.admission_year_label}
                onChange={(e) => setData({ ...data, admission_year_label: e.target.value })}
                placeholder="e.g. 2025-26" className={inputCls} />
            </Field>
          </div>

          {/* Hero Stats */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">Hero Stats (shown below description)</p>
              <AddBtn onClick={addHeroStat} label="Add Stat" />
            </div>
            {data.hero_stats.length === 0 ? (
              <EmptyState icon={<BarChart2 className="w-5 h-5" />} text="No stats added — hero stats section will be hidden." />
            ) : (
              <div className="space-y-3">
                {data.hero_stats.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                      <Field label="Value"><input type="text" value={s.value} onChange={(e) => updateHeroStat(i, "value", e.target.value)} placeholder="e.g. 3500+" className={smInputCls} /></Field>
                      <Field label="Label"><input type="text" value={s.label} onChange={(e) => updateHeroStat(i, "label", e.target.value)} placeholder="e.g. Students" className={smInputCls} /></Field>
                      <Field label="Icon (Lucide Name)">
                        <select value={s.icon} onChange={(e) => updateHeroStat(i, "icon", e.target.value)} className={smInputCls}>
                          {SUGGESTED_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="mt-6"><DeleteBtn onClick={() => removeHeroStat(i)} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Stats Highlights ── */}
      {tab === "highlights" && (
        <div className={sectionBox}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
              <BarChart2 className="w-4.5 h-4.5 text-[var(--primary)]" /> Statistics &amp; Highlights
            </h2>
            <AddBtn onClick={addHighlight} label="Add Stat" />
          </div>
          {data.highlights.length === 0 ? (
            <EmptyState icon={<BarChart2 className="w-5 h-5" />} text='No highlights defined yet. Click "Add Stat" to create one.' />
          ) : (
            <div className="space-y-3">
              {data.highlights.map((h, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border flex gap-4 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                    <Field label="Value / Stat"><input type="text" value={h.value} onChange={(e) => updateHighlight(i, "value", e.target.value)} placeholder="e.g. 2500+" className={smInputCls} /></Field>
                    <Field label="Label"><input type="text" value={h.label} onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="e.g. Happy Students" className={smInputCls} /></Field>
                    <IconSelect value={h.icon || "Star"} onChange={(v) => updateHighlight(i, "icon", v)} />
                  </div>
                  <div className="mt-6"><DeleteBtn onClick={() => removeHighlight(i)} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Features / Why Choose Us ── */}
      {tab === "features" && (
        <div className={sectionBox}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[var(--primary)]" /> Value Propositions (Why Choose Us)
            </h2>
            <AddBtn onClick={addFeature} label="Add Feature" />
          </div>
          {data.why_choose_us.length === 0 ? (
            <EmptyState icon={<Sparkles className="w-5 h-5" />} text="No features defined yet. Add reasons why parents should choose your school." />
          ) : (
            <div className="space-y-4">
              {data.why_choose_us.map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400">
                      <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[12px] font-semibold">Feature #{i + 1}</span>
                    </div>
                    <DeleteBtn onClick={() => removeFeature(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <Field label="Title"><input type="text" value={f.title} onChange={(e) => updateFeature(i, "title", e.target.value)} placeholder="e.g. Smart Classrooms" className={smInputCls} /></Field>
                    <IconSelect value={f.icon} onChange={(v) => updateFeature(i, "icon", v)} />
                    <div className="md:col-span-2">
                      <Field label="Short Description"><input type="text" value={f.desc} onChange={(e) => updateFeature(i, "desc", e.target.value)} placeholder="Describe this feature briefly..." className={smInputCls} /></Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Facilities ── */}
      {tab === "facilities" && (
        <div className={sectionBox}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-[var(--primary)]" /> Campus Facilities
            </h2>
            <AddBtn onClick={addFacility} label="Add Facility" />
          </div>
          {data.facilities.length === 0 ? (
            <EmptyState icon={<Building2 className="w-5 h-5" />} text="No facilities listed yet. Add your school's key facilities." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {data.facilities.map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border flex gap-3 items-center">
                  <Trophy className="w-5 h-5 text-[var(--primary)] shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-2 text-left">
                    <input type="text" value={f.title} onChange={(e) => updateFacility(i, "title", e.target.value)}
                      placeholder="e.g. Physics Lab" className={smInputCls} />
                    <select value={f.icon} onChange={(e) => updateFacility(i, "icon", e.target.value)} className={smInputCls}>
                      {SUGGESTED_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </div>
                  <DeleteBtn onClick={() => removeFacility(i)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Testimonials ── */}
      {tab === "testimonials" && (
        <div className={sectionBox}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-[var(--primary)]" /> Family &amp; Alumni Testimonials
            </h2>
            <AddBtn onClick={addTestimonial} label="Add Testimonial" />
          </div>
          {data.testimonials.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-5 h-5" />} text="No testimonials added. Add reviews from parents, alumni, or students." />
          ) : (
            <div className="space-y-4">
              {data.testimonials.map((t, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-550 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400">
                      <Star className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[12px] font-semibold">Testimonial #{i + 1}</span>
                    </div>
                    <DeleteBtn onClick={() => removeTestimonial(i)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <Field label="Full Name"><input type="text" value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} placeholder="e.g. Rajesh Kumar" className={smInputCls} /></Field>
                    <Field label="Role / Description"><input type="text" value={t.role} onChange={(e) => updateTestimonial(i, "role", e.target.value)} placeholder="e.g. Parent of Class X student" className={smInputCls} /></Field>
                    <div className="md:col-span-2">
                      <FileUploadField label="User Photo" value={t.img}
                        onChange={(v) => updateTestimonial(i, "img", v)}
                        accept="image/*" placeholder="https://... (photo URL or upload)" />
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Review Content">
                        <textarea value={t.content} onChange={(e) => updateTestimonial(i, "content", e.target.value)}
                          placeholder="Type testimonial review text here..." rows={2}
                          className={smInputCls + " resize-none"} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: FAQs ── */}
      {tab === "faq" && (
        <div className={sectionBox}>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-foreground dark:text-slate-900 dark:text-white font-bold text-[15px] flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-[var(--primary)]" /> Frequently Asked Questions
            </h2>
            <AddBtn onClick={addFAQ} label="Add FAQ" />
          </div>
          {data.faqs.length === 0 ? (
            <EmptyState icon={<HelpCircle className="w-5 h-5" />} text='No FAQs created. Click "Add FAQ" to add common questions.' />
          ) : (
            <div className="space-y-4">
              {data.faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-600 dark:text-slate-500 dark:text-slate-400">
                      <HelpCircle className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-[12px] font-semibold">FAQ #{i + 1}</span>
                    </div>
                    <DeleteBtn onClick={() => removeFAQ(i)} />
                  </div>
                  <Field label="Question"><input type="text" value={faq.question} onChange={(e) => updateFAQ(i, "question", e.target.value)} placeholder="e.g. What are the school hours?" className={smInputCls} /></Field>
                  <Field label="Answer">
                    <textarea value={faq.answer} onChange={(e) => updateFAQ(i, "answer", e.target.value)}
                      placeholder="Type the answer here..." rows={2}
                      className={smInputCls + " resize-none"} />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Bottom */}
      <div className="flex justify-end pb-6">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] hover:opacity-95 disabled:opacity-60 text-white text-[14px] font-semibold transition-all shadow-md">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
