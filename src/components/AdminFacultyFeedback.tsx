import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyse } from "@/lib/campus";
import { seedFacultyFeedback, subjectFeedbackForAdmin } from "@/lib/faculty-feedback";
import { useCampus } from "@/lib/store";
import { useFacultyDirectory } from "@/lib/use-faculty-directory";

const YEARS = ["1st", "2nd", "3rd", "4th"];
export function AdminFacultyFeedback() {
  const all = useMemo(seedFacultyFeedback, []);
  const { feedback, session } = useCampus();
  const faculty = useFacultyDirectory(session?.isDemo);
  const [year, setYear] = useState(1);
  const [fac, setFac] = useState(faculty[0]?.id ?? "");
  const t = faculty.find((f) => f.id === fac) ?? faculty[0];
  const selectedId = t?.id ?? "";
  const list = [...subjectFeedbackForAdmin(feedback, selectedId, year), ...all.filter((f) => f.year === year && f.facultyId === selectedId)].sort((a, b) => b.date.localeCompare(a.date));
  const avg = list.length ? list.reduce((a, f) => a + f.rating, 0) / list.length : 0;
  if (session?.role !== "Admin") return null;
  return <>
    <header className="mb-6"><h1 className="font-display text-2xl font-bold">Faculty Feedback by Year</h1><p className="text-sm text-muted-foreground">Student feedback for every faculty, separated by 1st–4th year.</p></header>
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Year">{YEARS.map((y, i) => <Button key={y} size="sm" variant={year === i + 1 ? "default" : "outline"} onClick={() => setYear(i + 1)}>{y} Year</Button>)}</div>
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Faculty">{faculty.map((f) => <Button key={f.id} size="sm" variant={selectedId === f.id ? "secondary" : "ghost"} onClick={() => setFac(f.id)}>{f.name}</Button>)}</div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[["Faculty", t ? `${t.name} · ${t.subject}` : "No faculty available"], ["Feedback", list.length], ["Average rating", `${avg.toFixed(1)} / 5`]].map(([l, v]) => <div key={l} className="rounded-xl border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="mt-1 font-semibold">{v}</p></div>)}
    </div>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr>{["Date", "Rating", "Feedback", "Sentiment"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>
      {list.map((f) => <tr key={f.id} className="border-t"><td className="px-3 py-2">{f.date}</td><td className="px-3 py-2">{"★".repeat(f.rating)}</td><td className="px-3 py-2">{f.text}</td><td className="px-3 py-2"><Badge variant="outline">{analyse(f.text).sentiment}</Badge></td></tr>)}
    </tbody></table></div>
  </>;
}
