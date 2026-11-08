import { createContext, type Context } from "react";
import type { Feedback, Role, Student } from "./campus";
import type { FacultyLeave, StudentLeave } from "./leave-notifications";
import type { DailyAttendanceRecord } from "./daily-attendance";

export interface Session { email: string; role: Role; name: string; studentId?: string | undefined; facultyId?: string | undefined; subject?: string | undefined; exp: number; isDemo?: boolean }
export interface CampusContextValue {
  ready: boolean;
  students: Student[];
  feedback: Feedback[];
  dailyAttendance: DailyAttendanceRecord[];
  setDailyAttendance: (records: DailyAttendanceRecord[]) => Promise<void>;
  studentLeaves: StudentLeave[];
  setStudentLeaves: (leaves: StudentLeave[]) => void;
  demoFacultyLeaves: FacultyLeave[];
  setDemoFacultyLeaves: (leaves: FacultyLeave[]) => void;
  setStudents: (students: Student[]) => void;
  setFeedback: (feedback: Feedback[]) => void;
  session: Session | null;
  startDemo: (role: Role) => void;
  logout: () => Promise<void>;
  reset: () => void;
}
// Retain only the context identity during development; account state stays in
// each provider instance, never in this registry (including during SSR).
const developmentRegistry = globalThis as typeof globalThis & {
  __gmuCampusContext?: Context<CampusContextValue | null>;
};
export const campusContext = import.meta.env.DEV
  ? (developmentRegistry.__gmuCampusContext ??= createContext<CampusContextValue | null>(null))
  : createContext<CampusContextValue | null>(null);