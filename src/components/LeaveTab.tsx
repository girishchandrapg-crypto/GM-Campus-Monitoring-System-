import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SUBJECTS } from "@/lib/campus";
import { useCampus } from "@/lib/store";
import { KEY as FAC_KEY, SEED as FAC_SEED, type Faculty } from "./FacultyTab";
import type { StudentLeave } from "@/lib/leave-notifications";

type Status = "Pending" | "Approved" | "Rejected";
export type Leave = StudentLeave;
const TYPES = ["Medical Leave", "Personal Leave", "Family Function", "Sports / Event Participation", "Other"];
const STYLE: Record<Status, string> = {
  Pending: "bg-warning/20 text-foreground border-warning/40",
  Approved: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};
const today = () => new Date().toISOString().slice(0, 10);

export type OverallStatus = "Accepted" | "Rejected" | "Partially Approved" | "Pending";
export function leaveOverallStatus(l: Leave): OverallStatus {
  const s = l.teachers.map((t) => t.status);
  if (s.length && s.every((x) => x === "Approved")) return "Accepted";
  if (s.length && s.every((x) => x === "Rejected")) return "Rejected";
  if (s.some((x) => x === "Approved") || s.some((x) => x === "Rejected")) return "Partially Approved";
  return "Pending";
}
const OVERALL_STYLE: Record<OverallStatus, string> = {
  Accepted: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  "Partially Approved": "bg-warning/20 text-foreground border-warning/40",
  Pending: "bg-muted text-muted-foreground border-border",
};

export function LeaveTab() {
  const { session, students, studentLeaves: list, setStudentLeaves: persist } = useCampus();
  const isAdmin = session?.role === "Admin";
  const isFaculty = session?.role === "Faculty";
  const me = students.find((s) => s.id === session?.studentId);
  const [faculty, setFaculty] = useState<Faculty[]>(FAC_SEED);
  const [form, setForm] = useState({ type: TYPES[0] ?? "Other", from: today(), to: today(), reason: "", subjects: [...SUBJECTS] as string[] });

  useEffect(() => {
    if (session?.isDemo) { setFaculty(FAC_SEED); return; }
    try { setFaculty(JSON.parse(localStorage.getItem(FAC_KEY) || "null") ?? FAC_SEED); } catch { /* keep seed */ }
  }, [session?.isDemo,isFaculty,session?.subject,session?.name]);
  const teacherFor = (sub: string) => faculty.find((f) => f.subject === sub)?.name ?? "Subject Teacher";

  const submit = () => {
    if (!session?.studentId) return undefined;
    if (form.from < today()) return toast.error("Start date cannot be in the past.");
    if (form.to < form.from) return toast.error("End date must be on or after the start date.");
    const reason = form.reason.trim();
    if (reason.length < 10 || reason.length > 500) return toast.error("Reason must be 10–500 characters.");
    if (!form.subjects.length) return toast.error("Select at least one subject.");
    const l: Leave = {
      id: `LV${Date.now().toString().slice(-6)}`, studentId: session.studentId, studentName: me?.name ?? session.name,
      type: form.type, from: form.from, to: form.to, reason, submitted: today(),
      teachers: form.subjects.map((s) => ({ subject: s, teacher: teacherFor(s), status: "Pending" as Status })),
    };
    persist([l, ...list]);
    setForm({ ...form, reason: "" });
    toast.success(`Leave letter sent to ${l.teachers.length} teacher(s).`);
    return undefined;
  };
  const setStatus = (id: string, subject: string, status: Status) => {
    if (!isAdmin && !(isFaculty && subject === session?.subject)) return;
    persist(list.map((l) => l.id !== id ? l : { ...l, teachers: l.teachers.map((t) => t.subject === subject ? { ...t, status } : t) }));
  };

  const shown = isAdmin ? list : isFaculty ? list.filter((l) => l.teachers.some((t) => t.subject === session?.subject)) : list.filter((l) => l.studentId === session?.studentId);
  const days = (l: Leave) => Math.round((+new Date(l.to) - +new Date(l.from)) / 864e5) + 1;
  const visibleTeachers = (l: Leave) => l.teachers.filter((t) => !isFaculty || t.subject === session?.subject);
  const overallFor = (l: Leave) => leaveOverallStatus({ ...l, teachers: visibleTeachers(l) });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">{isFaculty ? "Student Leave Letters" : "Leave Letters"}</h1>
        <p className="text-muted-foreground">{isAdmin ? "Review student leave letters and record each subject teacher's decision." : "Write one leave letter and send it to the teachers of all your subjects."}</p>
      </div>

      {!isAdmin && !isFaculty && (
        <div className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">Leave type
              <select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm">From<Input type="date" className="mt-1" value={form.from} min={today()} onChange={(e) => setForm({ ...form, from: e.target.value })} /></label>
            <label className="text-sm">To<Input type="date" className="mt-1" value={form.to} min={form.from} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Send to teachers of</span>
              <button className="text-primary underline" onClick={() => setForm({ ...form, subjects: form.subjects.length === SUBJECTS.length ? [] : [...SUBJECTS] })}>
                {form.subjects.length === SUBJECTS.length ? "Clear all" : "Select all subjects"}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUBJECTS.map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <input type="checkbox" checked={form.subjects.includes(s)} onChange={(e) => setForm({ ...form, subjects: e.target.checked ? [...form.subjects, s] : form.subjects.filter((x) => x !== s) })} />
                  <span className="font-medium">{s}</span><span className="text-muted-foreground">– {teacherFor(s)}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="mt-4 block text-sm">Reason
            <Textarea className="mt-1" rows={4} maxLength={500} placeholder="Respected Sir/Madam, I request leave because…" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </label>
          <Button className="mt-4" onClick={submit}><Send className="mr-1 h-4 w-4" />Submit leave letter</Button>
        </div>
      )}

      <div className="space-y-4">
        {!shown.length && <p className="text-sm text-muted-foreground">No leave letters yet.</p>}
        {shown.map((l) => (
          <div key={l.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{l.type} · {l.from} to {l.to} ({days(l)} day{days(l) > 1 ? "s" : ""})</span>
                <Badge variant="outline" className={OVERALL_STYLE[overallFor(l)]}>
                  {overallFor(l)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{l.id} · {l.studentName} ({l.studentId}) · sent {l.submitted}</div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{l.reason}</p>
            <div className="mt-3 divide-y rounded-md border">
              {visibleTeachers(l).map((t) => (
                <div key={t.subject} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span><span className="font-medium">{t.subject}</span> – {t.teacher}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STYLE[t.status]}>{t.status}</Badge>
                    {(isAdmin || isFaculty) && t.status === "Pending" && <>
                      <Button size="sm" variant="outline" aria-label={`Approve ${l.id}`} onClick={() => setStatus(l.id, t.subject, "Approved")}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" aria-label={`Reject ${l.id}`} onClick={() => setStatus(l.id, t.subject, "Rejected")}><X className="h-4 w-4" /></Button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
