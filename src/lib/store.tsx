import { useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ACCOUNTS, seedFeedback, seedStudents, type Feedback, type Role, type Student } from "./campus";

import { campusContext as C, type Session } from "./campus-context";
import type { StudentLeave, FacultyLeave } from "./leave-notifications";
import { attendanceRows, attendanceSheets, type DailyAttendanceRecord } from "./daily-attendance";
export type { Session } from "./campus-context";
const K = { s: "gmu.students", f: "gmu.feedback", sess: "gmu.session", fails: "gmu.fails" };

export function CampusProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [students, setS] = useState<Student[]>([]);
  const [feedback, setF] = useState<Feedback[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [demoSession, setDemoSession] = useState<Session | null>(null);
  const [demoStudents, setDemoStudents] = useState<Student[]>([]);
  const [demoFeedback, setDemoFeedback] = useState<Feedback[]>([]);
  const [dailyAttendance, setAttendance] = useState<DailyAttendanceRecord[]>([]);
  const [demoAttendance, setDemoAttendance] = useState<DailyAttendanceRecord[]>([]);
  useEffect(() => {
    setAttendance([]);
    if (!session || demoSession || session.role === "Admin") return;
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const { data, error } = await supabase.from("attendance_marks").select("date, subject, year, student_id, present");
        if (active && !error && data) setAttendance(attendanceSheets(data));
      } catch { /* Keep the last submitted records during a temporary connection loss. */ }
      finally { loading = false; }
    };
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", focus); };
  }, [session?.email, session?.role, demoSession]);
  const setDailyAttendance = async (records: DailyAttendanceRecord[]) => {
    if (session?.role !== "Faculty") throw new Error("Only faculty can submit attendance.");
    const changed = records.filter((record) => dailyAttendance.find((saved) => saved.date === record.date && saved.subject === record.subject && saved.year === record.year) !== record);
    const rows = attendanceRows(changed);
    if (rows.length) {
      const { error } = await supabase.from("attendance_marks").upsert(rows, { onConflict: "date,subject,year,student_id" });
      if (error) throw new Error("Attendance could not be saved. Please try again.");
    }
    setAttendance(records);
  };
  const setDemoDailyAttendance = async (records: DailyAttendanceRecord[]) => { setDemoAttendance(records); };
  const [studentLeaves, setLeaves] = useState<StudentLeave[]>([]);
  const date = new Date().toISOString().slice(0, 10);
  const [demoLeaves, setDemoLeaves] = useState<StudentLeave[]>([{ id: "DEMO-LV1", studentId: "GMU2301", studentName: "Aarav Patil", type: "Medical Leave", from: date, to: date, reason: "Requesting leave for a medical appointment.", submitted: date, teachers: [{ subject: "Data Structures", teacher: "Prof. Lakshmi Rao", status: "Pending" }] }]);
  const [demoFacultyLeaves, setDemoFacultyLeaves] = useState<FacultyLeave[]>([{ id: "demo-faculty-leave", user_id: "demo", faculty_id: "FAC101", faculty_name: "Prof. Lakshmi Rao", from_date: date, to_date: date, reason: "Requesting leave for a medical appointment.", status: "Pending", created_at: new Date().toISOString() }]);
  useEffect(() => {
    const load = () => { try { setLeaves(JSON.parse(localStorage.getItem("gmu.leaves") || "[]")); } catch { setLeaves([]); } };
    load(); window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const setStudentLeaves = (leaves: StudentLeave[]) => { setLeaves(leaves); localStorage.setItem("gmu.leaves", JSON.stringify(leaves)); };

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(K.s) || "null") as Student[] | null;
      const seed = seedStudents();
      const st = s ? [...s, ...seed.filter((x) => !s.some((y) => y.id === x.id))] : seed;
      setS(st);
      setF(JSON.parse(localStorage.getItem(K.f) || "null") ?? seedFeedback(st));
    } catch {
      const st = seedStudents();
      setS(st); setF(seedFeedback(st));
    }
    setReady(true);
  }, []);

  const setStudents = (s: Student[]) => { setS(s); localStorage.setItem(K.s, JSON.stringify(s)); };
  const setFeedback = (f: Feedback[]) => { setF(f); localStorage.setItem(K.f, JSON.stringify(f)); };

  useEffect(() => {
    const load = async (uid: string | undefined, email: string) => {
      if (!uid) return setSession(null);
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("full_name, student_id, faculty_id, faculty_subject").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      const admin = (r ?? []).some((x) => x.role === "admin");
      const faculty = (r ?? []).some((x) => x.role === "faculty");
      setSession({ email, role: admin ? "Admin" : faculty ? "Faculty" : "Student", name: p?.full_name || email, studentId: p?.student_id ?? undefined, facultyId: p?.faculty_id ?? undefined, subject: p?.faculty_subject ?? undefined, exp: 0 });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => { setTimeout(() => void load(sess?.user.id, sess?.user.email ?? ""), 0); });
    supabase.auth.getUser().then(({ data }) => load(data.user?.id, data.user?.email ?? "").finally(() => setAuthReady(true)));
    return () => sub.subscription.unsubscribe();
  }, []);
  const startDemo = (role: Role) => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!account) return;
    const st = seedStudents();
    setDemoStudents(st);
    setDemoFeedback(seedFeedback(st));
    setDemoSession({ email: account.email, role: account.role, name: account.name, studentId: "studentId" in account ? account.studentId : undefined, facultyId: "facultyId" in account ? account.facultyId : undefined, subject: "subject" in account ? account.subject : undefined, exp: 0, isDemo: true });
  };
  const logout = async () => {
    if (demoSession) { setDemoSession(null); return; }
    await supabase.auth.signOut(); setSession(null);
  };
  const reset = () => { const st = seedStudents(); setStudents(st); setFeedback(seedFeedback(st)); };

  return <C.Provider value={{ dailyAttendance: demoSession ? demoAttendance : dailyAttendance, setDailyAttendance: demoSession ? setDemoDailyAttendance : setDailyAttendance, studentLeaves: demoSession ? demoLeaves : studentLeaves, setStudentLeaves: demoSession ? setDemoLeaves : setStudentLeaves, demoFacultyLeaves, setDemoFacultyLeaves, ready: ready && (authReady || !!demoSession), students: demoSession ? demoStudents : students, feedback: demoSession ? demoFeedback : feedback, setStudents: demoSession ? setDemoStudents : setStudents, setFeedback: demoSession ? setDemoFeedback : setFeedback, session: demoSession ?? session, startDemo, logout, reset: demoSession ? () => { const st = seedStudents(); setDemoStudents(st); setDemoFeedback(seedFeedback(st)); } : reset }}>{children}</C.Provider>;
}
export function useCampus() {
  const c = useContext(C);
  if (!c) throw new Error("useCampus outside provider");
  return c;
}
