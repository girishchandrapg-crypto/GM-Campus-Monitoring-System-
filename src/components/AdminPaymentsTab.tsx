import { useEffect, useState } from "react";
import { useCampus } from "@/lib/store";
import { duesFor } from "@/lib/payments";

interface Row { year: number; studentId: string; name: string; label: string; amount: number; receipt: string; date: string }
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function AdminPaymentsTab() {
  const { students, session } = useCampus();
  const [rows, setRows] = useState<Row[]>([]);
  const [year, setYear] = useState<number>(0);
  useEffect(() => {
    const out: Row[] = [];
    for (const s of students) {
      const yr = Math.min(4, Math.max(1, Math.ceil(s.sem / 2)));
      const n = Number(s.id.replace(/\D/g, "")) || 0;
      // Sample received payments so every year shows data
      duesFor(s).filter((d) => d.key === "tuition" || d.key === "hostel").forEach((d, i) => out.push({ year: yr, studentId: s.id, name: s.name, label: d.label, amount: d.amount, receipt: `GMU-S${s.id}-${i}`, date: `2026-${String(7 + (n % 3)).padStart(2, "0")}-${String(1 + (n % 27)).padStart(2, "0")}` }));
      if (session?.isDemo) continue;
      try {
        const paid = JSON.parse(localStorage.getItem(`gmu.payments.${s.id}`) || "[]") as { key: string; amount: number; receipt: string; date: string; method?: string }[];
        const labels = Object.fromEntries(duesFor(s).map((d) => [d.key, d.label]));
        paid.forEach((p) => out.push({ year: yr, studentId: s.id, name: s.name, label: (labels[p.key] ?? p.key) + (p.method ? ` (${p.method})` : ""), amount: p.amount, receipt: p.receipt, date: p.date }));
      } catch { /* skip unreadable record */ }
    }
    setRows(out.sort((a, b) => b.date.localeCompare(a.date)));
  }, [students, session?.isDemo]);
  const shown = year ? rows.filter((r) => r.year === year) : rows;
  const total = shown.reduce((a, r) => a + r.amount, 0);
  return <>
    <header className="mb-6"><h1 className="font-display text-2xl font-bold">Payments Received</h1><p className="text-sm text-muted-foreground">All student payments credited to the GM University admin account.</p></header>
    <div className="mb-4 flex flex-wrap gap-2">
      {[0, 1, 2, 3, 4].map((y) => <button key={y} onClick={() => setYear(y)} className={`rounded-full border px-3 py-1.5 text-sm ${year === y ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{y ? `${["1st", "2nd", "3rd", "4th"][y - 1]} Year` : "All years"} ({y ? rows.filter((r) => r.year === y).length : rows.length})</button>)}
    </div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      {[["Total received", inr(total)], ["Transactions", shown.length]].map(([l, v]) => <div key={l} className="rounded-xl border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>)}
    </div>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr>{["Date", "Receipt", "Year", "USN", "Student", "Payment", "Amount"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>
      {shown.map((r) => <tr key={r.receipt + r.studentId} className="border-t"><td className="px-3 py-2">{r.date}</td><td className="px-3 py-2">{r.receipt}</td><td className="px-3 py-2">{r.year}</td><td className="px-3 py-2">{r.studentId}</td><td className="px-3 py-2">{r.name}</td><td className="px-3 py-2">{r.label}</td><td className="px-3 py-2 font-semibold">{inr(r.amount)}</td></tr>)}
      {!shown.length && <tr><td colSpan={7} className="px-3 py-6 text-muted-foreground">No payments received yet.</td></tr>}
    </tbody></table></div>
    <p className="mt-4 text-xs text-muted-foreground">Sample flow — no real money moves until a payment provider is connected.</p>
  </>;
}
