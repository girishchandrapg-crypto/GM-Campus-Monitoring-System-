import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ClipboardList, Briefcase, CalendarCheck, LogOut, Mail, MessageSquare, Send, UserRound, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCampus } from "@/lib/store";
import { analyse, subjectAttendance } from "@/lib/campus";
import { KEY, SEED, type Faculty } from "./FacultyTab";
import { LeaveTab } from "./LeaveTab";
import { FacultyLeaveTab } from "./FacultyLeaveTab";
import { EventsTab } from "./EventsTab";
import { DailyAttendanceTab } from "./DailyAttendanceTab";
import { FacultySubjectFeedback } from "./FacultySubjectFeedback";
import { LeaveNotificationBell } from "./LeaveNotificationBell";
import logo from "@/assets/gm-university-logo.jpg";

const tabs = [
  { key: "profile", label: "Faculty Profile", icon: UserRound },
  { key: "details", label: "Faculty Details", icon: Briefcase },
  { key: "students", label: "Student Details", icon: Users },
  { key: "manage", label: "Student Management", icon: ClipboardList },
  { key: "mark", label: "Mark Daily Attendance", icon: CalendarCheck },
  { key: "attendanceAll", label: "Attendance", icon: CalendarCheck },
  { key: "performance", label: "Academic Performance", icon: BarChart3 },
  { key: "attendance", label: "Student Attendance", icon: CalendarCheck },
  { key: "feedback", label: "Student Feedback", icon: MessageSquare },
  { key: "events", label: "Live Events", icon: CalendarCheck },
  { key: "leaves", label: "Student Leave Letters", icon: Mail },
  { key: "request", label: "Leave Letter to Admin", icon: Send },
] as const;

type PanelKey = "manage" | "attendanceAll" | "performance" | "feedbackAll";
export function FacultyDashboard({ panels }: { panels?: Partial<Record<PanelKey, ReactNode>> }) {
  const { session, students, feedback, logout } = useCampus();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("profile");
  const [faculty, setFaculty] = useState<Faculty[]>(SEED);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(1);
  useEffect(() => {
    if (session?.isDemo) { setFaculty(SEED); return; }
    try { setFaculty(JSON.parse(localStorage.getItem(KEY) || "null") ?? SEED); } catch { setFaculty(SEED); }
  }, [session?.isDemo]);
  if (!session || session.role !== "Faculty") return null;
  const me = faculty.find((f) => f.id === session.facultyId);
  const subject = session.subject ?? me?.subject;
  const deptRoster = students.filter((s) => !me || s.dept === me.dept);
  const roster = deptRoster.length >= 20 ? deptRoster : students;
  const yearOf = (sem: number) => Math.ceil(sem / 2);
  const yearRoster = roster.filter((s) => yearOf(s.sem) === year);
  const shown = yearRoster.filter((s) => `${s.id} ${s.name}`.toLowerCase().includes(search.toLowerCase()));
  const mine = feedback.filter((f) => f.facultyId === session.facultyId);
  const exit = async () => { await logout(); navigate({ to: "/", replace: true }); };
  const current = tabs.find((t) => t.key === tab);
  const details = [
    ["Faculty ID", session.facultyId ?? "Not assigned"], ["Name", session.name], ["Department", me?.dept ?? "Not assigned"],
    ["Designation", me?.designation ?? "Faculty"], ["Subject", subject ?? "Not assigned"], ["Qualification", me?.qualification ?? "Not provided"],
    ["Experience", me ? `${me.experience} years` : "Not provided"], ["Email", session.email], ["Phone", me?.phone ?? "Not provided"],
    ["Mentees", me?.mentees ?? 0], ["Status", me?.status ?? "Active"],
  ];
  return <div className="campus-dashboard flex min-h-screen">
    <aside className="dashboard-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
      <div className="mb-8 flex items-center gap-2"><img src={logo} alt="GM University logo" className="h-10 w-10 object-contain" /><div><p className="font-display font-bold">GM University</p><p className="text-xs opacity-70">Faculty Dashboard</p></div></div>
      <nav className="dashboard-nav flex-1 space-y-1 pb-4">{tabs.map(({ key, label, icon: Icon }) => <Button key={key} variant="ghost" aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)} className={`w-full justify-start gap-3 ${tab === key ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}><Icon className="h-4 w-4" />{label}</Button>)}</nav>
      <div className="border-t border-sidebar-border pt-4"><p className="text-sm font-semibold">{session.name}</p><p className="text-xs opacity-70">{session.facultyId} · Faculty</p><Button variant="ghost" size="sm" className="mt-2 text-sidebar-foreground" onClick={() => void exit()}><LogOut className="mr-2 h-4 w-4" />{session.isDemo ? "Exit demo" : "Sign out"}</Button></div>
    </aside>
    <main className="min-w-0 flex-1 p-5 md:p-8">
      <header className="dashboard-topbar flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><img src={logo} alt="GM University logo" className="h-10 w-10 shrink-0 object-contain md:hidden" /><div><p className="text-sm font-bold text-primary">GM University</p><p className="text-xs text-muted-foreground">Faculty Dashboard</p></div></div><div className="flex shrink-0 items-center gap-3"><Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">Faculty</Badge><LeaveNotificationBell onNavigate={() => setTab("request")} /></div></header>
      <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">{tabs.map((t) => <Button size="sm" key={t.key} variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key)}>{t.label}</Button>)}<Button size="sm" variant="ghost" onClick={() => void exit()}>{session.isDemo ? "Exit demo" : "Sign out"}</Button></div>
      {session.isDemo && <p className="mb-5 border-b pb-3 text-sm"><b>Faculty demo</b> · Sample data only</p>}
      {tab !== "leaves" && tab !== "request" && tab !== "events" && tab !== "feedback" && !(tab in (panels ?? {})) && <header className="dashboard-heading mb-6"><h1 className="font-display text-3xl font-bold">{current?.label}</h1><p className="mt-1 text-muted-foreground">{session.name} · {subject ?? "Faculty"}</p></header>}
      {tab === "profile" && <>
        <div className="mb-8 flex items-center gap-4 border-y border-primary/20 bg-primary/5 py-6 sm:gap-5"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground sm:h-20 sm:w-20"><UserRound className="h-9 w-9" /></div><div className="min-w-0"><h2 className="break-words font-display text-2xl font-semibold">{session.name}</h2><p className="text-muted-foreground">{me?.designation ?? "Faculty"} · {me?.dept ?? subject}</p><Badge variant="outline" className="mt-2 border-primary/30 text-primary">{session.facultyId}</Badge></div></div>
        <div className="grid gap-5 sm:grid-cols-3">{[["Students", roster.length], ["Feedback", mine.length], ["Subject", subject ?? "Not assigned"]].map(([label, value]) => <div key={label} className="dashboard-stat dashboard-card rounded-lg border p-5"><div className="mb-4 flex items-center justify-between gap-2"><p className="text-sm font-semibold text-muted-foreground">{label}</p><span className="dashboard-stat-icon grid h-9 w-9 place-items-center rounded-md">{label === "Students" ? <Users className="h-5 w-5" /> : label === "Feedback" ? <MessageSquare className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}</span></div><p className="break-words text-2xl font-semibold">{value}</p></div>)}</div>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">{details.slice(0,6).map(([label,value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>
      </>}
      {tab === "details" && <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label,value]) => <div key={label} className="border-b pb-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 break-words font-medium">{value}</dd></div>)}</dl>}
      {(tab === "mark" || tab === "students" || tab === "attendance") && <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Year">{[1, 2, 3, 4].map((y) => <Button key={y} size="sm" variant={year === y ? "default" : "outline"} onClick={() => setYear(y)}>{["1st", "2nd", "3rd", "4th"][y - 1]} Year ({roster.filter((s) => yearOf(s.sem) === y).length})</Button>)}</div>}
      {(tab === "students" || tab === "attendance") && <><Input aria-label="Search students" className="mb-4 max-w-sm" placeholder="Search USN or student name" value={search} onChange={(e) => setSearch(e.target.value)} /><div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr>{(tab === "students" ? ["USN","Student","Department","Semester","Email"] : ["USN","Student","Subject","Attended","Total","Attendance"]).map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{shown.map((s) => { const attendance = subjectAttendance(s).find((a) => a.subject === subject); return <tr key={s.id} className="border-t">{(tab === "students" ? [s.id,s.name,s.dept,s.sem,s.email] : [s.id,s.name,subject ?? "Not assigned",attendance?.attended ?? "—",attendance?.total ?? "—",attendance ? `${attendance.pct.toFixed(1)}%` : "—"]).map((value,i) => <td key={i} className="px-4 py-3">{value}</td>)}</tr>; })}{!shown.length && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No students found.</td></tr>}</tbody></table></div></>}
      {panels && tab in panels && panels[tab as PanelKey]}
      {tab === "mark" && <DailyAttendanceTab roster={yearRoster} subject={subject ?? "General"} year={year} />}
      {tab === "events" && <EventsTab />}
      {tab === "feedback" && <FacultySubjectFeedback />}
      {tab === "leaves" && <LeaveTab />}
      {tab === "request" && <FacultyLeaveTab />}
    </main>
  </div>;
}