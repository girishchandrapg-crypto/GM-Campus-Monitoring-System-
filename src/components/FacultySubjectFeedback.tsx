import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { seedFacultyFeedback, subjectFeedbackForAdmin } from "@/lib/faculty-feedback";
import { useCampus } from "@/lib/store";

export function FacultySubjectFeedback() {
  const { session, feedback } = useCampus();
  const sample = useMemo(seedFacultyFeedback, []);
  const [year, setYear] = useState(1);
  const [search, setSearch] = useState("");
  if (session?.role !== "Faculty") return null;
  const facultyId = session.facultyId ?? "";
  const rows = [...subjectFeedbackForAdmin(feedback, facultyId, year), ...sample.filter((f) => f.facultyId === facultyId && f.year === year)]
    .filter((f) => f.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  return <>
    <header className="mb-6"><h1 className="font-display text-2xl font-bold">Student Feedback</h1><p className="text-sm text-muted-foreground">{session.subject ?? "Assigned subject"}</p></header>
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Feedback year">{["1st", "2nd", "3rd", "4th"].map((label, i) => <Button key={label} size="sm" variant={year === i + 1 ? "default" : "outline"} onClick={() => setYear(i + 1)}>{label} Year</Button>)}</div>
    <Input className="mb-4 max-w-sm" aria-label="Search feedback" placeholder="Search feedback" value={search} onChange={(e) => setSearch(e.target.value)} />
    <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Feedback</th></tr></thead><tbody>{rows.map((f) => <tr className="border-t" key={f.id}><td className="whitespace-nowrap px-4 py-3">{f.rating} / 5</td><td className="px-4 py-3">{f.text}</td></tr>)}{rows.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-muted-foreground">No feedback for this year.</td></tr>}</tbody></table></div>
  </>;
}