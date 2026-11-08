import type { Student } from "./campus";
export function attendanceReport(roster: Student[], marks: Record<string, boolean>) {
  const rows = roster.filter((s) => s.id in marks).map((s) => ({ usn: s.id, student: s.name, status: marks[s.id] ? "Present" : "Absent" }));
  const present = rows.filter((r) => r.status === "Present").length;
  return { rows, total: rows.length, present, absent: rows.length - present, percentage: rows.length ? present / rows.length * 100 : 0 };
}