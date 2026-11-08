// GM University – Smart Campus engine: data, NLP, risk & recommendations
export const SUBJECTS = ["Mathematics", "Data Structures", "DBMS", "Python Programming", "Communication"] as const;
export type Subject = (typeof SUBJECTS)[number];

export interface Student {
  id: string;
  name: string;
  dept: string;
  sem: number;
  email: string;
  attended: number;
  totalClasses: number;
  marks: Record<Subject, number>;
}
export interface Feedback {
  id: string;
  studentId: string;
  date: string;
  text: string;
  subject?: string;
  facultyId?: string;
  year?: number;
  rating?: number;
}
export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Category = "Academic" | "Support" | "Campus" | "General";
export type Risk = "Low Risk" | "Moderate Risk" | "High Risk" | "Support Required";

const NAMES = [
  "Aarav Patil", "Ananya Hegde", "Rohan Kulkarni", "Sneha Gowda", "Vikram Shetty", "Divya Rao",
  "Karthik Naik", "Pooja Desai", "Rahul Joshi", "Meghana Bhat", "Suhas Reddy", "Kavya Murthy",
  "Nikhil Angadi", "Shreya Kamath", "Arjun Hiremath", "Bhavana Shenoy", "Pranav Kumar", "Sahana Iyer",
  "Tejas Banakar", "Nandini Patel", "Varun Menon", "Ishita Sharma", "Manoj Halli", "Ritika Nair",
];
const FIRST = ["Aditya","Akshata","Amit","Anusha","Bharath","Chaitra","Deepak","Gagan","Harsha","Jyothi","Kiran","Lavanya","Mahesh","Navya","Omkar","Prajwal","Rakshitha","Sachin","Spoorthi","Sunil","Swathi","Tanvi","Uday","Vaishnavi","Yashas","Zoya","Ganesh","Keerthi","Nithin","Pallavi","Rajat","Sanjana","Shashank","Sindhu","Vinay","Apoorva"];
const LAST = ["Gowda","Hegde","Kulkarni","Naik","Shetty","Rao","Patil","Bhat","Joshi","Desai","Murthy","Kamath"];
while (NAMES.length < 96) { const n = NAMES.length - 24; const name = `${FIRST[n % FIRST.length]} ${LAST[(n * 7) % LAST.length]}`; NAMES.push(NAMES.includes(name) ? `${name} ${String.fromCharCode(65 + (n % 26))}` : name); }
const DEPTS = ["CSE", "ISE", "ECE", "AI & DS", "Mechanical", "MBA"];

function rng(seed: number) {
  return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
}

export function seedStudents(): Student[] {
  const r = rng(42);
  return NAMES.map((name, i) => {
    const weak = r() < 0.3;
    const base = weak ? 30 : 55;
    const marks = Object.fromEntries(
      SUBJECTS.map((s) => [s, Math.min(100, Math.round(base + r() * 45))]),
    ) as Record<Subject, number>;
    const total = 120;
    const attended = Math.round(total * (weak ? 0.5 + r() * 0.3 : 0.7 + r() * 0.3));
    return {
      id: `GMU${String(2301 + i)}`,
      name,
      dept: DEPTS[i % DEPTS.length]!,
      sem: (i % 8) + 1,
      email: name.toLowerCase().replace(/ /g, ".") + "@gmu.ac.in",
      attended,
      totalClasses: total,
      marks,
    };
  });
}

const FB_TEXTS = [
  "The Data Structures lectures are excellent and very helpful",
  "Library wifi is very slow and keeps disconnecting, really frustrating",
  "I am struggling with mathematics and need extra classes",
  "Canteen food quality is poor and hygiene is bad",
  "Faculty mentor was supportive and guided me well",
  "Hostel water supply problem again, nobody responds to complaints",
  "Exam schedule is okay",
  "Lab computers are outdated and broken, cannot complete DBMS practicals",
  "Great campus events this semester, enjoyed the tech fest",
  "Need counselling support, feeling stressed about backlog subjects",
  "Classroom projector not working in block B",
  "Python programming assignments are difficult, need more doubt sessions",
  "Bus transport is late every day",
  "The placement training was good and useful",
  "Scholarship request pending for weeks, no help from office",
];

export function seedFeedback(students: Student[]): Feedback[] {
  const r = rng(7);
  return Array.from({ length: 30 }, (_, i) => {
    const s = students[Math.floor(r() * students.length)]!;
    const d = new Date(2026, 7 + Math.floor(i / 10), 1 + (i % 28));
    return { id: `FB${1000 + i}`, studentId: s.id, date: d.toISOString().slice(0, 10), text: FB_TEXTS[Math.floor(r() * FB_TEXTS.length)]! };
  });
}

/* ---------------- NLP ---------------- */
const STOP = new Set("the a an is are was were and or but to of in on for with my me i am be been it this that very really again every no nobody from at as so we our they them their not can cannot".split(" "));
const POS = ["excellent", "good", "great", "helpful", "supportive", "enjoyed", "useful", "well", "nice", "happy", "best", "clear", "okay"];
const NEG = ["slow", "poor", "bad", "struggling", "frustrating", "broken", "outdated", "late", "difficult", "stressed", "problem", "pending", "not", "disconnecting", "cannot", "worst", "dirty", "nobody", "backlog"];
const NEUTRAL_W = ["okay"];
const CAT: Record<Exclude<Category, "General">, string[]> = {
  Academic: ["lecture", "lectures", "mathematics", "exam", "assignments", "classes", "subjects", "dbms", "python", "programming", "structures", "practicals", "marks", "backlog", "doubt", "syllabus"],
  Support: ["mentor", "counselling", "help", "support", "scholarship", "office", "guided", "stressed", "placement", "training", "complaints"],
  Campus: ["wifi", "library", "canteen", "food", "hostel", "water", "lab", "computers", "projector", "bus", "transport", "classroom", "block", "hygiene", "events", "campus"],
};

export function cleanText(t: string) {
  return t.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}
export function tokenize(t: string) {
  return cleanText(t).split(" ").filter(Boolean);
}
export function keywords(t: string) {
  return tokenize(t).filter((w) => !STOP.has(w) && w.length > 2);
}
export function analyse(text: string) {
  const toks = tokenize(text);
  let score = 0;
  toks.forEach((w) => {
    if (POS.includes(w) && !NEUTRAL_W.includes(w)) score++;
    if (NEG.includes(w)) score--;
  });
  const sentiment: Sentiment = score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral";
  const counts = Object.entries(CAT).map(([c, ws]) => [c, toks.filter((w) => ws.includes(w)).length] as const);
  const best = counts.sort((a, b) => b[1] - a[1])[0]!;
  const category: Category = best[1] > 0 ? (best[0] as Category) : "General";
  const concerns = toks.filter((w) => NEG.includes(w) || Object.values(CAT).flat().includes(w));
  return { cleaned: cleanText(text), tokens: toks, keywords: keywords(text), sentiment, score, category, concerns: [...new Set(concerns)] };
}

/* ---------------- Performance & risk ---------------- */
export const attendancePct = (s: Student) => (s.totalClasses ? (s.attended / s.totalClasses) * 100 : 0);
export const avgMarks = (s: Student) => SUBJECTS.reduce((a, k) => a + s.marks[k], 0) / SUBJECTS.length;
/** Per-subject attendance: classes split evenly across subjects, attended varied deterministically per student and summing to the overall total. */
export function subjectAttendance(s: Student) {
  const n = SUBJECTS.length;
  const per = SUBJECTS.map((_, i) => Math.floor(s.totalClasses / n) + (i < s.totalClasses % n ? 1 : 0));
  const r = rng([...s.id].reduce((a, c) => a + c.charCodeAt(0), 0));
  const w = SUBJECTS.map(() => 0.6 + r() * 0.8);
  const base = s.totalClasses ? s.attended / s.totalClasses : 0;
  const att = per.map((t, i) => Math.max(0, Math.min(t, Math.round(t * base * w[i]!))));
  // adjust so the sum matches overall attended
  let diff = s.attended - att.reduce((a, b) => a + b, 0);
  for (let k = 0; diff !== 0 && k < 1000; k++) {
    const i = k % n;
    if (diff > 0 && att[i]! < per[i]!) { att[i]!++; diff--; }
    else if (diff < 0 && att[i]! > 0) { att[i]!--; diff++; }
  }
  return SUBJECTS.map((sub, i) => ({ subject: sub, attended: att[i]!, total: per[i]!, pct: per[i] ? (att[i]! / per[i]!) * 100 : 0 }));
}

/** Monthly per-subject attendance trend (deterministic). Monthly totals and attended sum exactly to each subject's totals. */
export function subjectMonthlyTrend(s: Student) {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec"];
  const subs = subjectAttendance(s);
  const r = rng([...s.id].reduce((a, c) => a + c.charCodeAt(0), 0) + 13);
  const w = months.map(() => 0.6 + r());
  const ws = w.reduce((a, b) => a + b, 0);
  const rows: Array<Record<string, string | number>> = months.map((month) => ({ month }));
  for (const x of subs) {
    let usedT = 0, usedA = 0;
    months.forEach((_, mi) => {
      const last = mi === months.length - 1;
      const total = last ? x.total - usedT : Math.round((x.total * w[mi]!) / ws);
      const attended = Math.max(0, Math.min(total, last ? x.attended - usedA : Math.round((x.attended * w[mi]!) / ws)));
      usedT += total; usedA += attended;
      rows[mi]![x.subject] = total ? +((attended / total) * 100).toFixed(1) : 0;
    });
  }
  return rows;
}
export const weakSubjects = (s: Student) => SUBJECTS.filter((k) => s.marks[k] < 40);
export function grade(avg: number) {
  if (avg >= 85) return "Distinction";
  if (avg >= 70) return "First Class";
  if (avg >= 55) return "Second Class";
  if (avg >= 40) return "Pass";
  return "At Risk";
}

export function riskFor(s: Student, fb: Feedback[]) {
  const mine = fb.filter((f) => f.studentId === s.id).map((f) => analyse(f.text));
  const neg = mine.filter((m) => m.sentiment === "Negative").length;
  const cats = mine.map((m) => m.category);
  const repeated = cats.some((c, i) => c !== "General" && cats.indexOf(c) !== i);
  const att = attendancePct(s);
  const avg = avgMarks(s);
  let pts = 0;
  if (att < 65) pts += 3; else if (att < 75) pts += 2;
  if (avg < 40) pts += 3; else if (avg < 55) pts += 1;
  pts += Math.min(2, neg);
  if (repeated) pts += 1;
  pts += Math.min(2, weakSubjects(s).length);
  const supportNeed = mine.some((m) => m.category === "Support" && m.sentiment === "Negative");
  let risk: Risk = pts >= 6 ? "High Risk" : pts >= 3 ? "Moderate Risk" : "Low Risk";
  if (supportNeed && risk !== "High Risk") risk = "Support Required";
  return { risk, score: pts, att, avg, neg, repeated, weak: weakSubjects(s) };
}

export function recommendations(s: Student, fb: Feedback[]) {
  const r = riskFor(s, fb);
  const out: string[] = [];
  if (r.att < 75) out.push(`Attendance counselling – currently ${r.att.toFixed(1)}% (minimum 75%).`);
  if (r.avg < 55) out.push("Additional academic support via remedial classes.");
  r.weak.forEach((w) => out.push(`Subject-specific improvement plan for ${w}.`));
  if (r.risk === "High Risk" || r.risk === "Support Required") out.push("Assign faculty mentor for weekly check-ins.");
  if (r.repeated) out.push("Review repeated concerns raised in feedback with the department.");
  if (r.neg >= 2) out.push("Student welfare officer to follow up on negative feedback.");
  if (!out.length) out.push("Keep up the good work – eligible for peer-mentor programme.");
  return out;
}

/* ---------------- CSV ---------------- */
export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const h = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [h.join(","), ...rows.map((r) => h.map((k) => esc(r[k])).join(","))].join("\n");
}
type CsvKey = "id" | "name" | "dept" | "sem" | "email" | "attended" | "totalClasses" | "studentId" | "date" | "text";
export function parseCSV(text: string): Record<CsvKey, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV file is empty or missing a header row.");
  const split = (l: string) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).slice(0, -1).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const h = split(lines[0]!);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [h[i], v])) as Record<CsvKey, string>);
}
export function download(name: string, csv: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}

/* ---------------- Validation ---------------- */
export function validateStudent(s: Partial<Student>, existing: Student[], isNew: boolean) {
  if (!s.id || !/^GMU\d{4}$/.test(s.id)) return "Invalid student ID – use format GMU1234.";
  if (isNew && existing.some((e) => e.id === s.id)) return "Student ID already exists.";
  if (!s.name || s.name.trim().length < 2 || s.name.length > 60) return "Name must be 2–60 characters.";
  if (!s.totalClasses || s.totalClasses <= 0 || !Number.isFinite(s.totalClasses)) return "Total classes must be a positive number.";
  if (s.attended == null || s.attended < 0 || s.attended > s.totalClasses) return "Attended classes must be between 0 and total.";
  for (const k of SUBJECTS) {
    const m = s.marks?.[k];
    if (m == null || !Number.isFinite(m) || m < 0 || m > 100) return `Incorrect marks for ${k} (0–100).`;
  }
  return null;
}

/* ---------------- Demo accounts ---------------- */
export const DEMO_ACCOUNTS = [
  { email: "admin@gmu.ac.in", password: "Admin@2026", role: "Admin", name: "Girish Chandra PG" },
  { email: "student@gmu.ac.in", password: "Student@2026", role: "Student", name: "Aarav Patil", studentId: "GMU2301" },
  { email: "lakshmi.rao@gmu.ac.in", password: "Faculty@2026", role: "Faculty", name: "Prof. Lakshmi Rao", facultyId: "FAC101", subject: "Data Structures" },
] as const;
export type Role = (typeof DEMO_ACCOUNTS)[number]["role"];
