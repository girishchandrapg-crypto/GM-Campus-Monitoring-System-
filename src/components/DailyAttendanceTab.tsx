import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampus } from "@/lib/store";
import type { Student } from "@/lib/campus";
import { download, toCSV } from "@/lib/campus";
import { attendanceReport } from "@/lib/attendance-report";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { localDate, type DailyAttendanceRecord } from "@/lib/daily-attendance";

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
type Day = (typeof DAYS)[number];
const dayOf = (date: string): Day | null => { const d = new Date(`${date}T00:00:00`).getDay(); return DAYS[d - 1] ?? null; };
const today = localDate;

/** Applies a (possibly edited) day's marks to student totals, undoing any previous record for the same day. */
export function applyDay(students: Student[], marks: Record<string, boolean>, prev?: Record<string, boolean>): Student[] {
  return students.map((s) => {
    if (!(s.id in marks)) return s;
    let { attended, totalClasses } = s;
    if (prev && s.id in prev) { totalClasses -= 1; if (prev[s.id]) attended -= 1; }
    totalClasses += 1; if (marks[s.id]) attended += 1;
    return { ...s, attended, totalClasses };
  });
}

export function DailyAttendanceTab({ roster, subject, year }: { roster: Student[]; subject: string; year: number }) {
  const { students, setStudents, dailyAttendance: records, setDailyAttendance: setRecords } = useCampus();
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const day = dayOf(date);
  const existing = records.find((r) => r.date === date && r.subject === subject && (r.year ?? 0) === year);
  useEffect(() => { setMarks(existing ? { ...existing.marks } : Object.fromEntries(roster.map((s) => [s.id, true]))); }, [date, subject, year, existing, roster.length]);
  const pickDay = (d: Day) => { const base = new Date(`${date}T00:00:00`); const cur = base.getDay() || 7; base.setDate(base.getDate() + (DAYS.indexOf(d) + 1 - cur)); setDate(base.toISOString().slice(0, 10)); };
  const submit = async () => {
    if (!day) return void toast.error("Sunday is a holiday. Pick MON–SAT.");
    if (date > today()) return void toast.error("Cannot mark attendance for a future date.");
    if (saving) return;
    setSaving(true);
    const rec: DailyAttendanceRecord = { date, day, subject, year, marks: { ...marks } };
    const next = [...records.filter((r) => !(r.date === date && r.subject === subject && (r.year ?? 0) === year)), rec];
    try {
      await setRecords(next);
      setStudents(applyDay(students, marks, existing?.marks));
      toast.success(`Year ${year}: ${existing ? "Updated" : "Submitted"} ${day} ${date} attendance`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Attendance could not be saved. Please try again."); }
    finally { setSaving(false); }
  };
  const present = roster.filter((s) => marks[s.id]).length;
  const report = existing ? attendanceReport(roster, existing.marks) : null;
  return <div>
    <div className="mb-4 flex flex-wrap gap-2">{DAYS.map((d) => <Button key={d} size="sm" variant={day === d ? "default" : "outline"} onClick={() => pickDay(d)}>{d}</Button>)}</div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input type="date" aria-label="Attendance date" className="w-44" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
      <span className="text-sm text-muted-foreground">{day ?? "SUN (holiday)"} · Year {year} · {subject} · {existing ? "Already submitted — editing" : "Not submitted yet"}</span>
    </div>
    <div className="mb-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => setMarks(Object.fromEntries(roster.map((s) => [s.id, true])))}>All present</Button><Button size="sm" variant="outline" onClick={() => setMarks(Object.fromEntries(roster.map((s) => [s.id, false])))}>All absent</Button></div>
    <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="px-4 py-3">USN</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status</th></tr></thead><tbody>
      {roster.map((s) => <tr key={s.id} className="border-t"><td className="px-4 py-3">{s.id}</td><td className="px-4 py-3">{s.name}</td><td className="px-4 py-3"><div className="flex gap-2">
        <Button size="sm" variant={marks[s.id] ? "default" : "outline"} onClick={() => setMarks({ ...marks, [s.id]: true })}>Present</Button>
        <Button size="sm" variant={marks[s.id] === false ? "destructive" : "outline"} onClick={() => setMarks({ ...marks, [s.id]: false })}>Absent</Button></div></td></tr>)}
      {!roster.length && <tr><td colSpan={3} className="px-4 py-6 text-muted-foreground">No students.</td></tr>}
    </tbody></table></div>
    <div className="mt-4 flex items-center gap-4"><Button onClick={() => void submit()} disabled={saving || !day || !roster.length}>{saving ? "Saving attendance…" : existing ? "Update attendance" : "Submit attendance"}</Button><span className="text-sm text-muted-foreground">Present {present} · Absent {roster.length - present}</span></div>
    {report && existing && <section aria-label="Submitted attendance report" className="mt-8 border-y py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Submitted attendance report</h2><p className="text-sm text-muted-foreground">{existing.day} · {existing.date} · Year {year} · {subject}</p></div><Button variant="outline" size="sm" onClick={() => download(`attendance-year-${year}-${date}.csv`, toCSV(report.rows.map((r) => ({ date, day: existing.day, year, subject, ...r }))))}><Download className="mr-2 h-4 w-4" />Download report</Button></div>
      <dl className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Total students", report.total], ["Present", report.present], ["Absent", report.absent], ["Attendance", `${report.percentage.toFixed(1)}%`]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold">{value}</dd></div>)}</dl>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr>{["USN", "Student", "Submitted status"].map((h) => <th className="px-4 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{report.rows.map((r) => <tr key={r.usn} className="border-t"><td className="px-4 py-3">{r.usn}</td><td className="px-4 py-3">{r.student}</td><td className="px-4 py-3"><Badge variant="outline" className={r.status === "Present" ? "border-success/30 bg-success/15 text-success" : "border-destructive/30 bg-destructive/15 text-destructive"}>{r.status}</Badge></td></tr>)}</tbody></table></div>
    </section>}
    {records.filter((r) => r.subject === subject && (r.year ?? 0) === year).length > 0 && <div className="mt-8"><h3 className="mb-2 font-semibold">Submitted days</h3><div className="flex flex-wrap gap-2">{records.filter((r) => r.subject === subject && (r.year ?? 0) === year).sort((a, b) => b.date.localeCompare(a.date)).map((r) => <Button key={r.date} size="sm" variant="outline" onClick={() => setDate(r.date)}>{r.day} {r.date} · {Object.values(r.marks).filter(Boolean).length}/{Object.keys(r.marks).length}</Button>)}</div></div>}
  </div>;
}
