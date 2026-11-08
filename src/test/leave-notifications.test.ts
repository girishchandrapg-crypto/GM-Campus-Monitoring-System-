import { describe, expect, it } from "vitest";
import { leaveNotifications, notificationAccount, type StudentLeave, type FacultyLeave } from "@/lib/leave-notifications";
import type { Session } from "@/lib/campus-context";
const student: Session = { role: "Student", email: "student@test.invalid", name: "Student", studentId: "S1", exp: 0 };
const leave: StudentLeave = { id: "L1", studentId: "S1", studentName: "Student", type: "Medical", from: "2026-11-09", to: "2026-11-10", submitted: "2026-11-07", reason: "Medical appointment", teachers: [{ subject: "Python", teacher: "Teacher", status: "Approved" }, { subject: "DBMS", teacher: "Teacher", status: "Rejected" }, { subject: "Data Structures", teacher: "Teacher", status: "Pending" }] };
describe("Leave decision notifications", () => {
  it("notifies a student of approved and rejected subject decisions, not pending decisions", () => {
    const notices = leaveNotifications(student, [leave], []);
    expect(notices.map((n) => n.status)).toEqual(["Approved", "Rejected"]);
    expect(notices.every((n) => n.target === "student-leave")).toBe(true);
  });
  it("excludes other students' decisions", () => { expect(leaveNotifications(student, [{ ...leave, studentId: "S2" }], [])).toEqual([]); });
  it("notifies faculty only of their own admin decisions", () => {
    const faculty: Session = { ...student, role: "Faculty", facultyId: "F1" };
    const row: FacultyLeave = { id: "FL1", faculty_id: "F1", faculty_name: "Teacher", user_id: "U1", from_date: "2026-11-09", to_date: "2026-11-10", reason: "Medical appointment", status: "Approved", created_at: "2026-11-07" };
    expect(leaveNotifications(faculty, [], [row, { ...row, id: "FL2", status: "Rejected" }, { ...row, id: "FL3", status: "Pending" }, { ...row, id: "FL4", faculty_id: "F2" }]).map((n) => n.status)).toEqual(["Approved", "Rejected"]);
  });
  it("scopes read markers to the recipient account", () => { expect(notificationAccount(student)).not.toBe(notificationAccount({ ...student, studentId: "S2" })); });
});