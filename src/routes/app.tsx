import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Users, CalendarCheck, GraduationCap, MessageSquare, Brain, ShieldAlert, Lightbulb, FileBarChart, LogOut, Search, Trash2, Pencil, Plus, Download, Upload, Bell, RotateCcw, Briefcase, Mail, CreditCard,
} from "lucide-react";
import { FacultyTab } from "@/components/FacultyTab";
import { LeaveTab } from "@/components/LeaveTab";
import { FacultyDashboard } from "@/components/FacultyDashboard";
import { FacultyLeaveTab } from "@/components/FacultyLeaveTab";
import { AdminPaymentsTab } from "@/components/AdminPaymentsTab";
import { EventsTab } from "@/components/EventsTab";
import { PaymentsTab } from "@/components/PaymentsTab";
import { AdminFacultyFeedback } from "@/components/AdminFacultyFeedback";
import { LeaveNotificationBell } from "@/components/LeaveNotificationBell";
import { StudentAttendanceCalendar } from "@/components/StudentAttendanceCalendar";
import { createSubjectFeedback } from "@/lib/faculty-feedback";
import { useFacultyDirectory } from "@/lib/use-faculty-directory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  SUBJECTS, analyse, attendancePct, avgMarks, download, grade, parseCSV, recommendations, riskFor, subjectAttendance, toCSV, validateStudent, weakSubjects,
  type Student, type Risk, type Subject,
} from "@/lib/campus";
import { useCampus } from "@/lib/store";
import gmuLogo from "@/assets/gm-university-logo.jpg";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard – GMU Smart Campus" },
      { name: "description", content: "GM University smart campus dashboard: students, attendance, NLP feedback, risk and recommendations." },
      { property: "og:title", content: "Dashboard – GMU Smart Campus" },
      { property: "og:description", content: "Monitor students and get AI-driven support recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

const TABS = [
  { k: "overview", l: "Overview", i: FileBarChart },
  { k: "events", l: "Live Events", i: CalendarCheck },
  { k: "payments", l: "Payments", i: CreditCard, studentOnly: true },
  { k: "students", l: "Student Management", i: Users, staff: true, noAdmin: true },
  { k: "faculty", l: "Faculty Management", i: Briefcase, staff: true, admin: true },
  { k: "attendance", l: "Attendance", i: CalendarCheck, noAdmin: true },
  { k: "performance", l: "Academic Performance", i: GraduationCap, noAdmin: true },
  { k: "feedback", l: "Feedback", i: MessageSquare, noAdmin: true },
  { k: "nlp", l: "NLP Results", i: Brain, staff: true },
  { k: "risk", l: "Risk Analysis", i: ShieldAlert },
  { k: "recs", l: "Recommendations", i: Lightbulb },
  { k: "leave", l: "Leave Letters", i: Mail, noAdmin: true },
  { k: "faculty-feedback", l: "Faculty Feedback", i: MessageSquare, admin: true },
  { k: "payments-received", l: "Payments Received", i: CreditCard, admin: true },
  { k: "faculty-leave", l: "Faculty Leave Letters", i: Mail, admin: true },
  { k: "reports", l: "Reports & CSV", i: Download, staff: true },
] as const;
type Tab = (typeof TABS)[number]["k"];

const RISK_STYLE: Record<Risk, string> = {
  "Low Risk": "bg-success/15 text-success border-success/30",
  "Moderate Risk": "bg-warning/20 text-foreground border-warning/40",
  "High Risk": "bg-destructive/15 text-destructive border-destructive/30",
  "Support Required": "bg-info/15 text-info border-info/30",
};
const SENT_STYLE = { Positive: "bg-success/15 text-success", Neutral: "bg-muted text-muted-foreground", Negative: "bg-destructive/15 text-destructive" };
const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AppPage() {
  const { ready, session, logout, students: all, feedback: allFb } = useCampus();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  useEffect(() => { if (ready && !session) nav({ to: "/" }); }, [ready, session, nav]);
  if (!ready || !session) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (session.role === "Faculty") return <FacultyDashboard panels={{ manage: <StudentsTab />, attendanceAll: <AttendanceTab students={all} />, performance: <PerformanceTab students={all} /> }} />;

  const staff = session.role !== "Student";
  const students = staff ? all : all.filter((s) => s.id === session.studentId);
  const feedback = staff ? allFb : allFb.filter((f) => f.studentId === session.studentId);
  const tabs = TABS.filter((t) => (staff || !("staff" in t)) && (session.role === "Admin" || !("admin" in t)) && (session.role !== "Admin" || !("noAdmin" in t)) && (!staff || !("studentOnly" in t)));

  return (
    <div className="campus-dashboard flex min-h-screen">
      <aside className="dashboard-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="mb-8 flex items-center gap-2">
          <img src={gmuLogo} alt="GM University logo" className="h-11 w-11 rounded-md object-contain" />
          <div><p className="font-display font-bold">GM University</p><p className="text-[10px] uppercase tracking-widest opacity-60">Smart Campus</p></div>
        </div>
        <nav className="dashboard-nav flex-1 space-y-1 pb-4">
          {tabs.map(({ k, l, i: I }) => (
            <Button variant="ghost" key={k} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)} className={`w-full justify-start gap-3 px-3 py-2 text-sm transition ${tab === k ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
              <I className="h-4 w-4" />{l}
            </Button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-4 text-sm">
          <p className="font-semibold">{session.name}</p>
          <p className="text-xs opacity-60">{session.role}</p>
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); nav({ to: "/", replace: true }); }} className="mt-3 gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-3 w-3" />Sign out</Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="dashboard-topbar flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><img src={gmuLogo} alt="GM University logo" className="h-10 w-10 shrink-0 object-contain md:hidden" /><div><p className="text-sm font-bold text-primary">GM University</p><p className="text-xs text-muted-foreground">{session.role} Dashboard</p></div></div><div className="flex shrink-0 items-center gap-3"><Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{session.role}</Badge>{!staff && <LeaveNotificationBell onNavigate={() => setTab("leave")} />}</div></header>
        {session.isDemo && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm"><span><b>{session.role} demo</b> · Sample data only</span><Button size="sm" variant="outline" onClick={async () => { await logout(); nav({ to: "/", replace: true }); }}>Exit demo</Button></div>}
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {tabs.map((t) => <Button key={t.k} size="sm" variant={tab === t.k ? "default" : "outline"} onClick={() => setTab(t.k)}>{t.l}</Button>)}
          <Button size="sm" variant="ghost" onClick={async () => { await logout(); nav({ to: "/", replace: true }); }}>Sign out</Button>
        </div>
        <div key={tab} className="fade-up">
          {tab === "overview" && <Overview students={students} onNavigate={setTab} />}
          {tab === "students" && <StudentsTab />}
          {tab === "faculty" && session.role === "Admin" && <FacultyTab />}
          {tab === "attendance" && <StudentAttendanceCalendar student={students[0]} />}
          {tab === "performance" && <PerformanceTab students={students} />}
          {tab === "feedback" && <FeedbackTab />}
          {tab === "nlp" && <NlpTab />}
          {tab === "risk" && <RiskTab students={students} />}
          {tab === "recs" && <RecsTab students={students} />}
          {tab === "reports" && <ReportsTab />}
          {tab === "leave" && <LeaveTab />}
          {tab === "events" && <EventsTab />}
          {tab === "payments" && !staff && <PaymentsTab />}
          {tab === "payments-received" && session.role === "Admin" && <AdminPaymentsTab />}
          {tab === "faculty-feedback" && session.role === "Admin" && <AdminFacultyFeedback />}
          {tab === "faculty-leave" && session.role === "Admin" && <FacultyLeaveTab />}
        </div>
        {!staff && feedback.length === 0 && tab === "overview" && <p className="mt-6 text-sm text-muted-foreground">You haven't submitted feedback yet.</p>}
      </main>
    </div>
  );
}

function Header({ t, d, children }: { t: string; d: string; children?: React.ReactNode }) {
  return (
    <div className="dashboard-heading mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold">{t}</h1><p className="text-muted-foreground">{d}</p></div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dashboard-card rounded-lg border bg-card p-5 ${className}`}>{children}</div>;
}
function Stat({ l, v, s }: { l: string; v: string | number; s?: string }) {
  const Icon = l.toLowerCase().includes("attendance") ? CalendarCheck : l.toLowerCase().includes("marks") ? GraduationCap : l.toLowerCase().includes("alert") ? Bell : Users;
  return <Card className="dashboard-stat"><div className="mb-4 flex items-start justify-between gap-2"><p className="text-sm font-semibold text-muted-foreground">{l}</p><span className="dashboard-stat-icon grid h-9 w-9 shrink-0 place-items-center rounded-md"><Icon className="h-5 w-5" /></span></div><p className="font-display text-3xl font-bold">{v}</p>{s && <p className="mt-2 text-xs text-muted-foreground">{s}</p>}</Card>;
}
function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i} className="border-t hover:bg-muted/40">{r.map((c, j) => <td key={j} className="px-4 py-2.5">{c}</td>)}</tr>) : <tr><td colSpan={head.length} className="px-4 py-8 text-center text-muted-foreground">No records found.</td></tr>}</tbody>
      </table>
    </div>
  );
}
function useRisks(students: Student[]) {
  const { feedback } = useCampus();
  return useMemo(() => students.map((s) => ({ s, ...riskFor(s, feedback) })), [students, feedback]);
}
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

/* ---------- Overview ---------- */
function Overview({ students, onNavigate }: { students: Student[]; onNavigate: (tab: Tab) => void }) {
  const risks = useRisks(students);
  const { feedback, session } = useCampus();
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const alerts = risks.filter((r) => r.att < 75 || r.risk === "High Risk").sort((a, b) => Number(b.risk === "High Risk") - Number(a.risk === "High Risk") || b.score - a.score);
  const criticalCount = alerts.filter((r) => r.risk === "High Risk").length;
  const dist = (["Low Risk", "Moderate Risk", "High Risk", "Support Required"] as Risk[]).map((k) => ({ name: k, value: risks.filter((r) => r.risk === k).length }));
  const sent = ["Positive", "Neutral", "Negative"].map((k) => ({ name: k, value: feedback.filter((f) => analyse(f.text).sentiment === k).length }));
  return (
    <>
      <Header t="Campus Overview" d="Real-time snapshot of GM University student wellbeing." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat l="Students" v={students.length} />
        <Stat l="Avg attendance" v={`${mean(risks.map((r) => r.att)).toFixed(1)}%`} />
        <Stat l="Avg marks" v={mean(risks.map((r) => r.avg)).toFixed(1)} />
        <Stat l="Active alerts" v={alerts.length} s="low attendance / high risk" />
      </div>
      <section aria-labelledby="automated-alerts-heading" className={`mt-6 border-y border-l-4 p-4 sm:p-5 ${alerts.length ? "border-warning bg-warning/10" : "border-success bg-success/10"}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${alerts.length ? "bg-warning/20 text-foreground" : "bg-success/20 text-success"}`}><Bell className="h-5 w-5" /></span>
            <div><h2 id="automated-alerts-heading" className="text-xl font-bold">Automated alerts</h2><p className="text-sm text-muted-foreground">{alerts.length ? `${alerts.length} student${alerts.length === 1 ? "" : "s"} need attention` : "No active alerts"}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalCount > 0 && <Badge variant="outline" className={RISK_STYLE["High Risk"]}><ShieldAlert className="mr-1 h-3.5 w-3.5" />{criticalCount} high risk</Badge>}
            {alerts.length > 0 && <Button size="sm" variant="outline" onClick={() => onNavigate("recs")}><Lightbulb className="mr-2 h-4 w-4" />View recommendations</Button>}
          </div>
        </div>
        <ul className="grid gap-3 text-sm xl:grid-cols-2">
          {(showAllAlerts ? alerts : alerts.slice(0, 4)).map((r) => (
            <li key={r.s.id} className={`flex min-w-0 flex-col items-start gap-3 rounded-md border border-l-4 bg-card p-4 ${r.risk === "High Risk" ? "border-destructive/30 border-l-destructive" : "border-warning/40 border-l-warning"}`}>
              <div className="flex w-full flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words font-semibold">{r.s.name} <span className="font-normal text-muted-foreground">({r.s.id})</span></span><Badge variant="outline" className={RISK_STYLE[r.risk]}>{r.risk}</Badge></div>
              <div className="flex flex-wrap gap-2">{r.att < 75 && <Badge variant="outline" className={RISK_STYLE["Moderate Risk"]}>Attendance {r.att.toFixed(1)}%</Badge>}<span className="text-muted-foreground">Average marks: {r.avg.toFixed(1)}</span></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onNavigate(r.att < 75 && session?.role !== "Admin" ? "attendance" : "risk")}><CalendarCheck className="mr-2 h-4 w-4" />{r.att < 75 && session?.role !== "Admin" ? "Review attendance" : "Review risk"}</Button></div>
            </li>
          ))}
        </ul>
        {!alerts.length && <p className="text-sm text-success">All clear — no low-attendance or high-risk students.</p>}
        {alerts.length > 4 && <Button className="mt-4" size="sm" variant="outline" onClick={() => setShowAllAlerts((value) => !value)}>{showAllAlerts ? "Show fewer alerts" : `View all ${alerts.length} alerts`}</Button>}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h3 className="mb-3 font-semibold">Risk distribution</h3><Donut data={dist} /></Card>
        <Card><h3 className="mb-3 font-semibold">Feedback sentiment</h3><Donut data={sent} colors={["var(--success)", "var(--muted-foreground)", "var(--destructive)"]} /></Card>
      </div>
    </>
  );
}
function Donut({ data, colors = CHART }: { data: { name: string; value: number }[]; colors?: string[] }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-48 w-48"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      <ul className="space-y-1 text-sm">{data.map((d, i) => <li key={d.name} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: colors[i % colors.length] }} />{d.name}: <b>{d.value}</b></li>)}</ul>
    </div>
  );
}

/* ---------- Students CRUD ---------- */
const empty = (): Student => ({ id: "", name: "", dept: "CSE", sem: 1, email: "", attended: 0, totalClasses: 120, marks: Object.fromEntries(SUBJECTS.map((s) => [s, 0])) as Record<Subject, number> });
function StudentsTab() {
  const { students, setStudents, session } = useCampus();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ s: Student; isNew: boolean } | null>(null);
  const list = students.filter((s) => `${s.id} ${s.name} ${s.dept}`.toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!edit) return;
    const err = validateStudent(edit.s, students, edit.isNew);
    if (err) return void toast.error(err);
    const s = { ...edit.s, name: edit.s.name.trim() };
    setStudents(edit.isNew ? [...students, s] : students.map((x) => (x.id === s.id ? s : x)));
    toast.success(edit.isNew ? "Student added" : "Student updated");
    setEdit(null);
  };
  const del = (id: string) => {
    if (session?.role !== "Admin") return void toast.error("Only Admin can delete records.");
    if (!confirm(`Delete ${id}?`)) return;
    setStudents(students.filter((s) => s.id !== id));
    toast.success("Deleted");
  };
  const num = (v: string) => (v === "" ? NaN : Number(v));
  return (
    <>
      <Header t="Student Management" d="Add, search, update and delete student records."><Button onClick={() => setEdit({ s: empty(), isNew: true })}><Plus className="mr-1 h-4 w-4" />Add student</Button></Header>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by ID, name, department" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {edit && (
        <Card className="mb-6">
          <h3 className="mb-4 font-semibold">{edit.isNew ? "New student" : `Edit ${edit.s.id}`}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <L l="Student ID"><Input disabled={!edit.isNew} placeholder="GMU2400" value={edit.s.id} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, id: e.target.value.toUpperCase() } })} /></L>
            <L l="Name"><Input maxLength={60} value={edit.s.name} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, name: e.target.value } })} /></L>
            <L l="Department"><Input maxLength={30} value={edit.s.dept} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, dept: e.target.value } })} /></L>
            <L l="Classes attended"><Input type="number" value={edit.s.attended} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, attended: num(e.target.value) } })} /></L>
            <L l="Total classes"><Input type="number" value={edit.s.totalClasses} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, totalClasses: num(e.target.value) } })} /></L>
            <L l="Semester"><Input type="number" min={1} max={8} value={edit.s.sem} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, sem: num(e.target.value) } })} /></L>
            {SUBJECTS.map((k) => <L key={k} l={`${k} (0–100)`}><Input type="number" value={edit.s.marks[k]} onChange={(e) => setEdit({ ...edit, s: { ...edit.s, marks: { ...edit.s.marks, [k]: num(e.target.value) } } })} /></L>)}
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button></div>
        </Card>
      )}
      <Table head={["ID", "Name", "Dept", "Sem", "Attendance", "Avg", ""]} rows={list.map((s) => [
        <b key="i">{s.id}</b>, s.name, s.dept, s.sem, `${attendancePct(s).toFixed(1)}%`, avgMarks(s).toFixed(1),
        <span key="a" className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setEdit({ s: structuredClone(s), isNew: false })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></span>,
      ])} />
    </>
  );
}
function L({ l, children }: { l: string; children: React.ReactNode }) {
  return <label className="space-y-1 text-xs font-medium text-muted-foreground"><span>{l}</span>{children}</label>;
}

/* ---------- Attendance ---------- */
function AttendanceTab({ students }: { students: Student[] }) {
  const data = students.map((s) => ({ name: s.id, pct: +attendancePct(s).toFixed(1) })).sort((a, b) => a.pct - b.pct);
  const low = data.filter((d) => d.pct < 75);
  return (
    <>
      <Header t="Attendance Monitoring" d="Percentage per student — threshold 75%." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat l="Mean" v={`${mean(data.map((d) => d.pct)).toFixed(1)}%`} /><Stat l="Std deviation" v={std(data.map((d) => d.pct)).toFixed(2)} /><Stat l="Below 75%" v={low.length} />
      </div>
      <Card className="mt-6"><div className="h-72"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={10} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Bar dataKey="pct" radius={[4, 4, 0, 0]}>{data.map((d) => <Cell key={d.name} fill={d.pct < 65 ? "var(--destructive)" : d.pct < 75 ? "var(--warning)" : "var(--chart-1)"} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
      <div className="mt-6"><Table head={["ID", "Name", "Attended", "Total", "%", "Alert"]} rows={students.map((s) => { const p = attendancePct(s); return [s.id, s.name, s.attended, s.totalClasses, `${p.toFixed(1)}%`, p < 65 ? <Badge key="b" variant="outline" className={RISK_STYLE["High Risk"]}>Critical</Badge> : p < 75 ? <Badge key="b" variant="outline" className={RISK_STYLE["Moderate Risk"]}>Low</Badge> : <Badge key="b" variant="outline" className={RISK_STYLE["Low Risk"]}>OK</Badge>]; })} /></div>
    </>
  );
}

/* ---------- Performance ---------- */
function PerformanceTab({ students }: { students: Student[] }) {
  const subj = SUBJECTS.map((k) => ({ name: k, avg: +mean(students.map((s) => s.marks[k])).toFixed(1) }));
  return (
    <>
      <Header t="Academic Performance" d="Subject averages, weak subjects and classification." />
      <Card><h3 className="mb-3 font-semibold">Subject-wise average</h3><div className="h-64"><ResponsiveContainer><BarChart data={subj}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Bar dataKey="avg" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <div className="mt-6"><Table head={["ID", "Name", ...SUBJECTS.map((s) => s.split(" ")[0]!), "Avg", "Class", "Weak subjects"]} rows={students.map((s) => [s.id, s.name, ...SUBJECTS.map((k) => <span key={k} className={s.marks[k] < 40 ? "font-semibold text-destructive" : ""}>{s.marks[k]}</span>), avgMarks(s).toFixed(1), grade(avgMarks(s)), weakSubjects(s).join(", ") || "—"])} /></div>
    </>
  );
}

/* ---------- Feedback ---------- */
function FeedbackTab() {
  const { feedback, setFeedback, session, students } = useCampus();
  const faculty = useFacultyDirectory(session?.isDemo);
  const [text, setText] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [q, setQ] = useState("");
  const mine = feedback.filter((f) => f.studentId === session?.studentId);
  const list = mine.filter((f) => `${f.subject ?? ""} ${f.text}`.toLowerCase().includes(q.toLowerCase())).slice().reverse();
  const submit = () => {
    if (session?.role !== "Student") return;
    const student = students.find((s) => s.id === session.studentId);
    if (!student) return void toast.error("Your student record could not be found.");
    try {
      const entry = createSubjectFeedback(student, facultyId, Number(rating), text, faculty, Number(year));
      setFeedback([...feedback, entry]);
      toast.success("Feedback submitted for faculty and Admin review.");
      setText(""); setRating(""); setFacultyId(""); setYear("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit feedback."); }
  };
  if (session?.role !== "Student") return null;
  return (
    <>
      <Header t="Student Feedback" d="Subject feedback · Faculty and Admin review" />
      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <L l="Your year"><select aria-label="Your year" required className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground" value={year} onChange={(e) => setYear(e.target.value)}><option value="">Choose your year</option>{["1st", "2nd", "3rd", "4th"].map((y, i) => <option key={y} value={i + 1}>{y} Year</option>)}</select></L>
          <L l="Subject / Faculty"><select aria-label="Subject / Faculty" required className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm text-foreground" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}><option value="">Choose a subject</option>{faculty.map((f) => <option key={f.id} value={f.id}>{f.subject} · {f.name}</option>)}</select></L>
          <L l="Rating"><select aria-label="Rating" required className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={rating} onChange={(e) => setRating(e.target.value)}><option value="">Choose a rating</option>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} / 5</option>)}</select></L>
          <div className="sm:col-span-3"><L l="Feedback / complaint"><Textarea maxLength={500} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your feedback about this subject" /></L></div>
        </div>
        <Button className="mt-3" onClick={submit}>Submit feedback</Button>
      </Card>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search feedback" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Table head={["Date", "Year", "Subject", "Rating", "Feedback", "Sentiment"]} rows={list.map((f) => { const a = analyse(f.text); return [f.date, f.year ? `${["1st", "2nd", "3rd", "4th"][f.year - 1]} Year` : "—", f.subject ?? "General", f.rating ? `${f.rating} / 5` : "—", f.text, <span key="s" className={`rounded px-2 py-0.5 text-xs ${SENT_STYLE[a.sentiment]}`}>{a.sentiment}</span>]; })} />
    </>
  );
}

/* ---------- NLP ---------- */
function NlpTab() {
  const { feedback } = useCampus();
  const [t, setT] = useState("The lab computers are broken and I am struggling with DBMS practicals!");
  const a = analyse(t);
  const freq = useMemo(() => {
    const m = new Map<string, number>();
    feedback.forEach((f) => analyse(f.text).concerns.forEach((c) => m.set(c, (m.get(c) || 0) + 1)));
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
  }, [feedback]);
  const cats = ["Academic", "Support", "Campus", "General"].map((c) => ({ name: c, value: feedback.filter((f) => analyse(f.text).category === c).length }));
  return (
    <>
      <Header t="NLP Feedback Analysis" d="Cleaning → tokenization → keywords → sentiment → category." />
      <Card>
        <L l="Try any text"><Textarea rows={2} maxLength={500} value={t} onChange={(e) => setT(e.target.value)} /></L>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div><p className="text-xs uppercase text-muted-foreground">Cleaned</p><p className="font-mono">{a.cleaned || "—"}</p></div>
          <div><p className="text-xs uppercase text-muted-foreground">Tokens ({a.tokens.length})</p><div className="flex flex-wrap gap-1">{a.tokens.map((w, i) => <code key={i} className="rounded bg-muted px-1.5">{w}</code>)}</div></div>
          <div><p className="text-xs uppercase text-muted-foreground">Keywords</p><div className="flex flex-wrap gap-1">{a.keywords.map((w, i) => <Badge key={i} variant="secondary">{w}</Badge>)}</div></div>
          <div className="flex gap-6"><div><p className="text-xs uppercase text-muted-foreground">Sentiment</p><span className={`rounded px-2 py-0.5 ${SENT_STYLE[a.sentiment]}`}>{a.sentiment} ({a.score})</span></div><div><p className="text-xs uppercase text-muted-foreground">Category</p><b>{a.category}</b></div><div><p className="text-xs uppercase text-muted-foreground">Concerns</p>{a.concerns.join(", ") || "—"}</div></div>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h3 className="mb-3 font-semibold">Frequently reported concerns</h3><div className="h-64"><ResponsiveContainer><BarChart data={freq} layout="vertical"><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" width={90} fontSize={11} /><Tooltip /><Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><h3 className="mb-3 font-semibold">Concern categories</h3><Donut data={cats} /></Card>
      </div>
    </>
  );
}

/* ---------- Risk ---------- */
function RiskTab({ students }: { students: Student[] }) {
  const risks = useRisks(students).sort((a, b) => b.score - a.score);
  return (
    <>
      <Header t="AI Student Risk Analysis" d="Weighted model: attendance, marks, negative sentiment, repeated concerns, weak subjects." />
      <Table head={["ID", "Name", "Attendance", "Avg", "Neg. feedback", "Repeated", "Score", "Risk"]} rows={risks.map((r) => [r.s.id, r.s.name, `${r.att.toFixed(0)}%`, r.avg.toFixed(1), r.neg, r.repeated ? "Yes" : "No", r.score, <Badge key="r" variant="outline" className={RISK_STYLE[r.risk]}>{r.risk}</Badge>])} />
    </>
  );
}

/* ---------- Recommendations ---------- */
function RecsTab({ students }: { students: Student[] }) {
  const risks = useRisks(students).sort((a, b) => b.score - a.score);
  const { feedback } = useCampus();
  return (
    <>
      <Header t="Intelligent Recommendations" d="Personalised support actions per student." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {risks.map((r) => (
          <Card key={r.s.id}>
            <div className="mb-2 flex items-start justify-between gap-2"><div><p className="font-semibold">{r.s.name}</p><p className="text-xs text-muted-foreground">{r.s.id} · {r.s.dept}</p></div><Badge variant="outline" className={RISK_STYLE[r.risk]}>{r.risk}</Badge></div>
            <ul className="space-y-1.5 text-sm">{recommendations(r.s, feedback).map((x) => <li key={x} className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{x}</li>)}</ul>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------- Reports ---------- */
function ReportsTab() {
  const { students, feedback, setStudents, setFeedback, reset, session } = useCampus();
  const files = {
    "students.csv": () => students.map(({ marks: _m, ...s }) => s),
    "attendance.csv": () => students.map((s) => ({ id: s.id, attended: s.attended, total: s.totalClasses, pct: attendancePct(s).toFixed(2) })),
    "marks.csv": () => students.map((s) => ({ id: s.id, ...s.marks, avg: avgMarks(s).toFixed(2), class: grade(avgMarks(s)) })),
    "feedback.csv": () => feedback.map((f) => { const a = analyse(f.text); return { ...f, sentiment: a.sentiment, category: a.category }; }),
    "risk_analysis.csv": () => students.map((s) => { const r = riskFor(s, feedback); return { id: s.id, name: s.name, attendance: r.att.toFixed(1), avg: r.avg.toFixed(1), score: r.score, risk: r.risk }; }),
    "recommendations.csv": () => students.map((s) => ({ id: s.id, recommendations: recommendations(s, feedback).join(" | ") })),
  };
  const importFile = async (kind: "students" | "feedback", file?: File) => {
    try {
      if (!file) throw new Error("No file selected.");
      if (file.size > 1_000_000) throw new Error("File too large (max 1 MB).");
      const rows = parseCSV(await file.text());
      if (kind === "feedback") {
        const ids = new Set(students.map((s) => s.id));
        const ok = rows.filter((r) => r.text?.trim() && ids.has(r.studentId)).map((r, i) => ({ id: r.id || `FB${Date.now()}${i}`, studentId: r.studentId, date: r.date || new Date().toISOString().slice(0, 10), text: r.text.slice(0, 500) }));
        setFeedback([...feedback, ...ok]);
        toast.success(`Imported ${ok.length} feedback, skipped ${rows.length - ok.length} invalid.`);
      } else {
        const marks = Object.fromEntries(SUBJECTS.map((k) => [k, 0])) as Record<Subject, number>;
        const parsed = rows.map((r) => ({ id: r.id ?? "", name: r.name ?? "", dept: r.dept ?? "", sem: Number(r["sem"]), email: r.email ?? "", attended: Number(r["attended"]), totalClasses: Number(r["totalClasses"]), marks: { ...marks } }));
        const ok = parsed.filter((s) => !validateStudent(s, students, true));
        setStudents([...students, ...ok]);
        toast.success(`Imported ${ok.length} students, skipped ${parsed.length - ok.length} invalid.`);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import failed."); }
  };
  const s = students.map(attendancePct), m = students.map(avgMarks);
  return (
    <>
      <Header t="Reports & CSV Data" d="Export datasets, import CSV, and view statistical summary.">
        {session?.role === "Admin" && <Button variant="outline" onClick={() => { if (confirm("Reset to sample GMU data?")) { reset(); toast.success("Data reset"); } }}><RotateCcw className="mr-1 h-4 w-4" />Reset data</Button>}
      </Header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(files).map(([n, f]) => <Button key={n} variant="outline" className="justify-start" onClick={() => download(n, toCSV(f() as Record<string, unknown>[]))}><Download className="mr-2 h-4 w-4" />{n}</Button>)}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["students", "feedback"] as const).map((k) => (
          <Card key={k}><p className="mb-2 flex items-center gap-2 font-semibold"><Upload className="h-4 w-4" />Import {k}.csv</p><Input type="file" accept=".csv,text/csv" onChange={(e) => importFile(k, e.target.files?.[0])} /></Card>
        ))}
      </div>
      <Card className="mt-6">
        <h3 className="mb-3 font-semibold">Statistical summary (describe)</h3>
        <Table head={["Metric", "Count", "Mean", "Std", "Min", "Max"]} rows={[["Attendance %", s], ["Average marks", m]].map(([l, a]) => { const v = a as number[]; return [l as string, v.length, mean(v).toFixed(2), std(v).toFixed(2), Math.min(...v).toFixed(1), Math.max(...v).toFixed(1)]; })} />
      </Card>
    </>
  );
}
