import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampus } from "@/lib/store";
import { SUBJECTS, type Student } from "@/lib/campus";
import { attendanceDayStatus, calendarDays, defaultAttendanceSubject, localDate } from "@/lib/daily-attendance";

const statusStyle = {
  Present: "border-success/40 bg-success/20 text-foreground",
  Absent: "border-destructive/40 bg-destructive/15 text-foreground",
  "Not marked": "border-destructive/30 bg-destructive/10 text-foreground",
  Holiday: "border-border bg-muted text-muted-foreground",
  Upcoming: "border-border bg-background text-muted-foreground",
};
export function StudentAttendanceCalendar({ student }: { student: Student | undefined }) {
  const { dailyAttendance } = useCampus();
  const today = localDate();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [subjectSelection, setSubjectSelection] = useState<{ studentId: string; subject: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  if (!student) return <div><h1 className="text-3xl font-bold">Attendance</h1><p className="mt-4 text-muted-foreground">No attendance record is linked to your student ID yet.</p></div>;
  const year = Math.ceil(student.sem / 2);
  const subject = subjectSelection?.studentId === student.id
    ? subjectSelection.subject
    : defaultAttendanceSubject(dailyAttendance, year, student.id, today, SUBJECTS[0]);
  const subjects = [...new Set([...SUBJECTS, ...dailyAttendance.filter((r) => r.year === year && student.id in r.marks).map((r) => r.subject)])];
  const { dates, offset } = calendarDays(month);
  const days = dates.map((date) => ({ date, status: attendanceDayStatus(dailyAttendance, date, subject, year, student.id, today) }));
  const move = (step: number) => { const y = Number(month.slice(0, 4)); const m = Number(month.slice(5, 7)); setMonth(localDate(new Date(y, m - 1 + step, 1)).slice(0, 7)); setSelected(null); };
  const label = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const detail = days.find((d) => d.date === selected);
  return <div>
    <header className="mb-6"><h1 className="text-3xl font-bold">Attendance</h1><p className="mt-1 text-muted-foreground">{student.name} · Year {year}</p></header>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <label className="grid gap-2 text-sm font-medium">Subject<select aria-label="Attendance subject" value={subject} onChange={(e) => { setSubjectSelection({ studentId: student.id, subject: e.target.value }); setSelected(null); }} className="h-10 max-w-full rounded-md border bg-background px-3 text-foreground">{subjects.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Month<Input aria-label="Attendance month" type="month" value={month} onChange={(e) => { if (e.target.value) { setMonth(e.target.value); setSelected(null); } }} className="w-48" /></label>
    </div>
    <div className="mb-6 grid grid-cols-2 gap-4 border-y py-4 sm:grid-cols-4">{["Present", "Absent", "Not marked", "Upcoming"].map((status) => <div key={status}><p className="text-sm text-muted-foreground">{status}</p><p className="mt-1 text-2xl font-semibold">{days.filter((d) => d.status === status).length}</p></div>)}</div>
    <section aria-label="Monthly attendance calendar">
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl font-semibold">{label}</h2><div className="flex gap-1"><Button variant="outline" size="icon" title="Previous month" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button><Button variant="outline" size="sm" onClick={() => { setMonth(today.slice(0, 7)); setSelected(null); }}>Today</Button><Button variant="outline" size="icon" title="Next month" aria-label="Next month" onClick={() => move(1)}><ChevronRight /></Button></div></div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">{[["bg-success", "Present"], ["bg-destructive", "Absent / Not marked"], ["bg-muted", "Holiday / Upcoming"]].map(([color, text]) => <span className="flex items-center gap-2" key={text}><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{text}</span>)}</div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground sm:text-xs">{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={`blank-${i}`} />)}
        {days.map(({ date, status }) => <Button key={date} variant="outline" aria-label={`${date}: ${status}`} aria-pressed={selected === date} onClick={() => setSelected(date)} className={`h-auto min-w-0 flex-col gap-1 px-0 py-2 shadow-none aspect-square sm:aspect-auto sm:h-24 ${statusStyle[status]} ${selected === date ? "ring-2 ring-ring" : ""}`}><span className="text-sm font-semibold sm:text-lg">{Number(date.slice(-2))}</span>{status === "Present" ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-success" /> : status === "Absent" || status === "Not marked" ? <X className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" /> : <span className="h-3 sm:h-4" />}<span className="hidden text-[10px] sm:block">{status}</span></Button>)}
      </div>
      {detail && <div aria-live="polite" className="mt-4 border-l-4 border-primary bg-muted p-4 text-sm"><b>{new Date(`${detail.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</b><p className="mt-1">{subject} · {detail.status}</p></div>}
    </section>
  </div>;
}