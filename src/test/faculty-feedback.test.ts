import { expect, it } from "vitest";
import { createSubjectFeedback, seedFacultyFeedback, subjectFeedbackForAdmin } from "@/lib/faculty-feedback";
import { seedStudents } from "@/lib/campus";
it("has at least 20 feedback per faculty per year for 6 faculty", () => {
  const all = seedFacultyFeedback();
  const fac = new Set(all.map((f) => f.facultyId));
  expect(fac.size).toBe(6);
  for (const id of fac) for (const y of [1, 2, 3, 4]) expect(all.filter((f) => f.facultyId === id && f.year === y).length).toBeGreaterThanOrEqual(20);
});
it("requires a subject before submission", () => {
  const student = seedStudents()[0];
  if (!student) throw new Error("Missing sample student");
  expect(() => createSubjectFeedback(student, "", 5, "Clear lectures")).toThrow("Choose a subject");
});
it.each([["FAC101", "Data Structures"], ["FAC102", "DBMS"], ["FAC103", "Python Programming"]])("groups %s feedback under its subject and student year", (id, subject) => {
  const student = seedStudents().find((s) => s.sem === 7);
  if (!student) throw new Error("Missing fourth year student");
  const entry = createSubjectFeedback(student, id, 4, "Useful practical sessions");
  expect(entry.subject).toBe(subject);
  expect(subjectFeedbackForAdmin([entry], id, 4)).toEqual([{ id: entry.id, date: entry.date, text: "Useful practical sessions", rating: 4, subject }]);
  expect(subjectFeedbackForAdmin([entry], id, 1)).toEqual([]);
  expect(subjectFeedbackForAdmin([entry], "FAC107", 4)).toEqual([]);
});
it("excludes student names and USNs from Admin feedback records", () => {
  const student = seedStudents()[0];
  if (!student) throw new Error("Missing sample student");
  const rows = subjectFeedbackForAdmin([createSubjectFeedback(student, "FAC101", 5, "Clear lectures")], "FAC101", 1);
  expect(JSON.stringify(rows)).not.toContain(student.id);
  expect(JSON.stringify(rows)).not.toContain(student.name);
});
it("uses the year the student selects instead of their semester", () => {
  const student = seedStudents().find((s) => s.sem === 7);
  if (!student) throw new Error("Missing fourth year student");
  const entry = createSubjectFeedback(student, "FAC101", 5, "Clear lectures", undefined, 2);
  expect(entry.year).toBe(2);
  expect(subjectFeedbackForAdmin([entry], "FAC101", 2).length).toBe(1);
  expect(subjectFeedbackForAdmin([entry], "FAC101", 4).length).toBe(0);
  expect(() => createSubjectFeedback(student, "FAC101", 5, "Clear lectures", undefined, 0)).toThrow("year");
});
it("requires a valid rating", () => {
  const student = seedStudents()[0];
  if (!student) throw new Error("Missing sample student");
  expect(() => createSubjectFeedback(student, "FAC101", 0, "Clear lectures")).toThrow("rating");
});
