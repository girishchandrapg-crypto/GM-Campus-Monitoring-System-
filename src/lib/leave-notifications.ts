import type { Session } from "./campus-context";
import type { Database } from "@/integrations/supabase/types";
export type LeaveDecision = "Pending" | "Approved" | "Rejected";
export interface StudentLeave {
  id: string; studentId: string; studentName: string; type: string; from: string; to: string; reason: string;
  submitted: string; teachers: { subject: string; teacher: string; status: LeaveDecision }[];
}
export type FacultyLeave = Database["public"]["Tables"]["faculty_leave_requests"]["Row"];
export interface LeaveNotification { id: string; title: string; detail: string; status: "Approved" | "Rejected"; date: string; target: "student-leave" | "faculty-leave" }
export function leaveNotifications(session: Session, studentLeaves: StudentLeave[], facultyLeaves: FacultyLeave[]): LeaveNotification[] {
  if (session.role === "Student") return studentLeaves.filter((l) => l.studentId === session.studentId).flatMap((l) => l.teachers.flatMap((t) => {
    if (t.status === "Pending") return [];
    return [{ id: `student:${l.id}:${t.subject}:${t.status}`, title: `Leave ${t.status.toLowerCase()}`, detail: `${t.subject} · ${l.from} to ${l.to} · ${t.teacher}`, status: t.status, date: l.submitted, target: "student-leave" as const }];
  }));
  if (session.role === "Faculty") return facultyLeaves.filter((l) => l.faculty_id === session.facultyId).flatMap((l) => {
    if (l.status !== "Approved" && l.status !== "Rejected") return [];
    return [{ id: `faculty:${l.id}:${l.status}`, title: `Leave ${l.status.toLowerCase()}`, detail: `Admin decision · ${l.from_date} to ${l.to_date}`, status: l.status, date: l.created_at, target: "faculty-leave" as const }];
  });
  return [];
}
export function notificationAccount(session: Session) { return `${session.role}:${session.email}:${session.studentId ?? session.facultyId ?? ""}`; }