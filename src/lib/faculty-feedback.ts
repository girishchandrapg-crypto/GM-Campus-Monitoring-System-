import { seedStudents, type Feedback, type Student } from "./campus";
import { SEED } from "@/components/FacultyTab";

export interface FacultyFeedback { id: string; facultyId: string; studentId: string; studentName: string; year: number; rating: number; text: string; date: string }
const TEXTS: [number, string][] = [
  [5, "Explains concepts very clearly with real examples"], [4, "Classes are well structured and easy to follow"],
  [5, "Very supportive and always clears doubts after class"], [3, "Good teaching but the pace is a little fast"],
  [4, "Assignments are useful and help in exams"], [2, "Needs more practical sessions and fewer slides"],
  [3, "Notes are helpful, would like more revision classes"], [5, "Motivating mentor, makes the subject interesting"],
  [4, "Lab sessions are well organised"], [2, "Hard to hear in the back rows, please use a mic"],
  [3, "Tests are tough, more practice problems would help"], [4, "Punctual and covers the syllabus on time"],
];
export const PER_YEAR = 20;
export function createSubjectFeedback(student: Student, facultyId: string, rating: number, text: string, faculty = SEED, year?: number): Feedback {
  const teacher = faculty.find((f) => f.id === facultyId);
  if (!teacher) throw new Error("Choose a subject before submitting feedback.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.");
  if (!text.trim() || text.trim().length > 500) throw new Error("Enter feedback of 1–500 characters.");
  const studentYear = year ?? Math.ceil(student.sem / 2);
  if (!Number.isInteger(studentYear) || studentYear < 1 || studentYear > 4) throw new Error("Choose your year (1st–4th) before submitting feedback.");
  return { id: `FB-${crypto.randomUUID()}`, studentId: student.id, date: new Date().toISOString().slice(0, 10), text: text.trim(), facultyId: teacher.id, subject: teacher.subject, year: studentYear, rating };
}

/** Admin display projection deliberately excludes student identifiers. */
export function subjectFeedbackForAdmin(feedback: Feedback[], facultyId: string, year: number) {
  return feedback.filter((f) => f.facultyId === facultyId && f.year === year).map(({ id, date, text, rating, subject }) => ({ id, date, text, rating: rating ?? 0, subject }));
}
/** Deterministic sample: 20 feedback entries per faculty for each of the 4 years. */
export function seedFacultyFeedback(): FacultyFeedback[] {
  const students = seedStudents();
  const out: FacultyFeedback[] = [];
  SEED.slice(0, 6).forEach((f, fi) => {
    for (let year = 1; year <= 4; year++) {
      const pool = students.filter((s) => Math.ceil(s.sem / 2) === year);
      for (let i = 0; i < PER_YEAR; i++) {
        const s = pool[(i + fi) % pool.length]!;
        const [rating, text] = TEXTS[(i * 5 + fi * 3 + year) % TEXTS.length]!;
        const day = 1 + ((i * 3 + fi + year) % 28);
        out.push({ id: `FF-${f.id}-${year}-${i}`, facultyId: f.id, studentId: s.id, studentName: s.name, year, rating, text, date: `2026-10-${String(day).padStart(2, "0")}` });
      }
    }
  });
  return out;
}
