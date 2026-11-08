import { attendancePct, SUBJECTS, type Student } from "./campus";
export interface Due { key: string; label: string; amount: number; detail: string }
export const FEES = { tuition: 95000, hostel: 60000, shortagePerSubject: 1000, reExamPerSubject: 1500 };
/** Hostel status is a deterministic sample flag until real records exist. */
export const inHostel = (s: Student) => Number(s.id.replace(/\D/g, "")) % 2 === 1;
export function duesFor(s: Student): Due[] {
  const d: Due[] = [{ key: "fee", label: "Tuition Fee", amount: FEES.tuition, detail: `Semester ${s.sem} academic fee` }];
  if (inHostel(s)) d.push({ key: "hostel", label: "Hostel Fee", amount: FEES.hostel, detail: "Hostel accommodation and mess" });
  if (attendancePct(s) < 75) d.push({ key: "shortage", label: "Attendance Shortage Fine", amount: FEES.shortagePerSubject * SUBJECTS.length, detail: `Attendance ${attendancePct(s).toFixed(1)}% is below 75%` });
  const failed = SUBJECTS.filter((k) => s.marks[k] < 40);
  if (failed.length) d.push({ key: "reexam", label: "Re-Exam Fee", amount: FEES.reExamPerSubject * failed.length, detail: failed.join(", ") });
  return d;
}
