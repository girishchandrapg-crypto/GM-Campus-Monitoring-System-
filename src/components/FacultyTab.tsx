import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Pencil, Plus, Search, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { download, toCSV } from "@/lib/campus";
import { useCampus } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { enableFacultyLogin } from "@/lib/faculty-access.functions";

export interface Faculty {
  id: string; name: string; designation: string; dept: string; subject: string;
  qualification: string; experience: number; email: string; phone: string;
  mentees: number; status: "Active" | "On Leave";
}

export const KEY = "gmu.faculty";
export const SEED: Faculty[] = [
  { id: "FAC101", name: "Prof. Lakshmi Rao", designation: "Associate Professor", dept: "CSE", subject: "Data Structures", qualification: "M.Tech, Ph.D", experience: 14, email: "lakshmi.rao@gmu.ac.in", phone: "9845012301", mentees: 12, status: "Active" },
  { id: "FAC102", name: "Dr. Mahesh Kumar B", designation: "Professor & HoD", dept: "CSE", subject: "DBMS", qualification: "M.Tech, Ph.D", experience: 21, email: "mahesh.kumar@gmu.ac.in", phone: "9845012302", mentees: 8, status: "Active" },
  { id: "FAC103", name: "Prof. Anitha H S", designation: "Assistant Professor", dept: "ISE", subject: "Python Programming", qualification: "M.Tech", experience: 7, email: "anitha.hs@gmu.ac.in", phone: "9845012303", mentees: 15, status: "Active" },
  { id: "FAC104", name: "Dr. Ravi Shankar K", designation: "Associate Professor", dept: "Mathematics", subject: "Mathematics", qualification: "M.Sc, Ph.D", experience: 16, email: "ravi.shankar@gmu.ac.in", phone: "9845012304", mentees: 10, status: "On Leave" },
  { id: "FAC105", name: "Prof. Shwetha Patil", designation: "Assistant Professor", dept: "Humanities", subject: "Communication", qualification: "M.A, B.Ed", experience: 9, email: "shwetha.patil@gmu.ac.in", phone: "9845012305", mentees: 14, status: "Active" },
  { id: "FAC106", name: "Prof. Naveen G M", designation: "Assistant Professor", dept: "ECE", subject: "Digital Electronics", qualification: "M.Tech", experience: 5, email: "naveen.gm@gmu.ac.in", phone: "9845012306", mentees: 11, status: "Active" },
  { id: "FAC107", name: "Dr. Kavya Reddy", designation: "Professor", dept: "AIML", subject: "Machine Learning", qualification: "M.Tech, Ph.D", experience: 18, email: "kavya.reddy@gmu.ac.in", phone: "9845012307", mentees: 9, status: "Active" },
];
const empty = (): Faculty => ({ id: "", name: "", designation: "Assistant Professor", dept: "", subject: "", qualification: "", experience: 0, email: "", phone: "", mentees: 0, status: "Active" });

function validate(f: Faculty, list: Faculty[], isNew: boolean) {
  if (!/^FAC\d{3,5}$/.test(f.id)) return "Faculty ID must look like FAC108.";
  if (isNew && list.some((x) => x.id === f.id)) return "Faculty ID already exists.";
  if (!/^[A-Za-z .]{3,60}$/.test(f.name.trim())) return "Name must be 3–60 letters.";
  if (!f.dept.trim() || !f.subject.trim()) return "Department and subject are required.";
  if (!/^[\w.+-]+@gmu\.ac\.in$/i.test(f.email)) return "Email must be a @gmu.ac.in address.";
  if (!/^[6-9]\d{9}$/.test(f.phone)) return "Phone must be a valid 10-digit number.";
  if (!Number.isFinite(f.experience) || f.experience < 0 || f.experience > 50) return "Experience must be 0–50 years.";
  if (!Number.isFinite(f.mentees) || f.mentees < 0 || f.mentees > 60) return "Mentees must be 0–60.";
  return null;
}

export function FacultyTab() {
  const { session } = useCampus();
  const grantLogin = useServerFn(enableFacultyLogin);
  const enable = async (f: Faculty) => {
    if (session?.isDemo) { toast.info("Demo accounts cannot change real login access."); return; }
    try {
      const result = await grantLogin({ data: { email: f.email, facultyId: f.id, subject: f.subject } });
      if (result.enabled) toast.success(`Faculty login enabled for ${f.id}.`);
      else toast.error("This teacher must create an account with their listed email first.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not enable login."); }
  };
  const [list, setList] = useState<Faculty[]>([]);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ f: Faculty; isNew: boolean } | null>(null);
  useEffect(() => { if (session?.isDemo) { setList(SEED); return; } try { setList(JSON.parse(localStorage.getItem(KEY) || "null") ?? SEED); } catch { setList(SEED); } }, [session?.isDemo]);
  const persist = (l: Faculty[]) => { setList(l); if (!session?.isDemo) localStorage.setItem(KEY, JSON.stringify(l)); };
  const shown = list.filter((f) => `${f.id} ${f.name} ${f.dept} ${f.subject}`.toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!edit) return;
    const f = { ...edit.f, name: edit.f.name.trim(), email: edit.f.email.trim().toLowerCase() };
    const err = validate(f, list, edit.isNew);
    if (err) return void toast.error(err);
    persist(edit.isNew ? [...list, f] : list.map((x) => (x.id === f.id ? f : x)));
    toast.success(edit.isNew ? "Faculty added" : "Faculty updated");
    setEdit(null);
  };
  const del = (id: string) => { if (confirm(`Remove ${id}?`)) { persist(list.filter((x) => x.id !== id)); toast.success("Removed"); } };
  const set = <K extends keyof Faculty>(k: K, v: Faculty[K]) => edit && setEdit({ ...edit, f: { ...edit.f, [k]: v } });
  const num = (v: string) => (v === "" ? NaN : Number(v));
  const depts = new Set(list.map((f) => f.dept)).size;
  const avgExp = list.length ? list.reduce((a, f) => a + f.experience, 0) / list.length : 0;
  const F = ({ l, k, type = "text" }: { l: string; k: keyof Faculty; type?: string }) => (
    <label className="space-y-1 text-xs font-medium text-muted-foreground"><span>{l}</span>
      <Input type={type} disabled={k === "id" && !edit?.isNew} value={String(edit?.f[k] ?? "")}
        onChange={(e) => set(k, (type === "number" ? num(e.target.value) : k === "id" ? e.target.value.toUpperCase() : e.target.value) as never)} />
    </label>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Faculty Management</h1><p className="text-sm text-muted-foreground">Admin-only: add, update and remove faculty and teacher records.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => download("gmu_faculty.csv", toCSV(list as unknown as Record<string, unknown>[]))}><Download className="mr-1 h-4 w-4" />Export CSV</Button>
          <Button onClick={() => setEdit({ f: empty(), isNew: true })}><Plus className="mr-1 h-4 w-4" />Add faculty</Button>
        </div>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[["Total faculty", list.length], ["Departments", depts], ["Avg experience", `${avgExp.toFixed(1)} yrs`], ["On leave", list.filter((f) => f.status === "On Leave").length]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by ID, name, department, subject" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {edit && (
        <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">{edit.isNew ? "New faculty member" : `Edit ${edit.f.id}`}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {F({ l: "Faculty ID", k: "id" })}{F({ l: "Full name", k: "name" })}{F({ l: "Designation", k: "designation" })}
            {F({ l: "Department", k: "dept" })}{F({ l: "Subject handled", k: "subject" })}{F({ l: "Qualification", k: "qualification" })}
            {F({ l: "Experience (years)", k: "experience", type: "number" })}{F({ l: "Email (@gmu.ac.in)", k: "email" })}{F({ l: "Phone", k: "phone" })}
            {F({ l: "Mentees assigned", k: "mentees", type: "number" })}
            <label className="space-y-1 text-xs font-medium text-muted-foreground"><span>Status</span>
              <select className="h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground" value={edit.f.status} onChange={(e) => set("status", e.target.value as Faculty["status"])}><option>Active</option><option>On Leave</option></select>
            </label>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button></div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr>{["ID", "Name", "Designation", "Dept", "Subject", "Exp", "Contact", "Mentees", "Status", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="px-3 py-2 font-bold">{f.id}</td><td className="px-3 py-2">{f.name}<p className="text-xs text-muted-foreground">{f.qualification}</p></td>
                <td className="px-3 py-2">{f.designation}</td><td className="px-3 py-2">{f.dept}</td><td className="px-3 py-2">{f.subject}</td>
                <td className="px-3 py-2">{f.experience} yrs</td><td className="px-3 py-2 text-xs">{f.email}<br />{f.phone}</td><td className="px-3 py-2">{f.mentees}</td>
                <td className="px-3 py-2"><Badge variant="outline" className={f.status === "Active" ? "bg-success/15 text-success border-success/30" : "bg-warning/20 text-foreground border-warning/40"}>{f.status}</Badge></td>
                <td className="px-3 py-2"><span className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Enable login for ${f.id}`} title="Enable faculty login" onClick={() => void enable(f)}><KeyRound className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setEdit({ f: { ...f }, isNew: false })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => del(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></span></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">No faculty found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
