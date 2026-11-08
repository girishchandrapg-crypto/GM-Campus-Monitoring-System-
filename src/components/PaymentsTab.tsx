import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCampus } from "@/lib/store";
import { duesFor, inHostel } from "@/lib/payments";

interface Paid { key: string; amount: number; receipt: string; date: string; method?: string }
const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM UPI"];
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function PaymentsTab() {
  const { session, students } = useCampus();
  const s = students.find((x) => x.id === session?.studentId);
  const key = `gmu.payments.${s?.id}`;
  const [paid, setPaid] = useState<Paid[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ keys: string[]; amount: number; label: string } | null>(null);
  const [app, setApp] = useState(UPI_APPS[0]);
  const [vpa, setVpa] = useState("");
  useEffect(() => { if (session?.isDemo || !s) return; try { setPaid(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setPaid([]); } }, [key, session?.isDemo, s]);
  if (!s) return <p className="text-muted-foreground">No student record is linked to this account.</p>;
  const dues = duesFor(s);
  const pending = dues.filter((d) => !paid.some((p) => p.key === d.key));
  const confirmUpi = () => {
    if (!checkout) return;
    if (!UPI_RE.test(vpa.trim())) { toast.error("Enter a valid UPI ID, e.g. name@okaxis"); return; }
    setBusy("upi");
    setTimeout(() => {
      const date = new Date().toISOString().slice(0, 10);
      const amt = Object.fromEntries(dues.map((d) => [d.key, d.amount]));
      const next = [...paid, ...checkout.keys.map((k, i) => ({ key: k, amount: amt[k] ?? 0, receipt: `GMU-UPI-${Date.now().toString().slice(-7)}${i}`, date, method: `UPI · ${app}` }))];
      setPaid(next); if (!session?.isDemo) localStorage.setItem(key, JSON.stringify(next));
      setBusy(null); setCheckout(null); setVpa(""); toast.success(`UPI payment of ${inr(checkout.amount)} successful`);
    }, 900);
  };
  return <>
    <header className="mb-6"><h1 className="font-display text-2xl font-bold">Payments</h1><p className="text-sm text-muted-foreground">{s.name} · {s.id} · {inHostel(s) ? "Hostel resident" : "Day scholar"}</p></header>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {[["Total dues", inr(dues.reduce((a, d) => a + d.amount, 0))], ["Pending", inr(pending.reduce((a, d) => a + d.amount, 0))], ["Paid", inr(paid.reduce((a, p) => a + p.amount, 0))]].map(([l, v]) => <div key={l} className="rounded-xl border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>)}
    </div>
    {pending.length > 1 && <Button className="mb-4" onClick={() => setCheckout({ keys: pending.map((d) => d.key), amount: pending.reduce((a, d) => a + d.amount, 0), label: "All pending dues" })}><Smartphone className="mr-2 h-4 w-4" />Pay all dues via UPI · {inr(pending.reduce((a, d) => a + d.amount, 0))}</Button>}
    <div className="grid gap-4 sm:grid-cols-2">{dues.map((d) => { const p = paid.find((x) => x.key === d.key); return (
      <article key={d.key} className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{d.label}</h3>{p ? <Badge variant="outline" className="bg-success/15 text-success">Paid</Badge> : <Badge variant="outline" className="bg-warning/20">Due</Badge>}</div>
        <p className="mt-1 text-sm text-muted-foreground">{d.detail}</p>
        <p className="mt-3 font-display text-2xl font-bold">{inr(d.amount)}</p>
        {p ? <p className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" />Receipt {p.receipt} · {p.date}{p.method ? ` · ${p.method}` : ""}</p>
          : <Button className="mt-3" disabled={busy !== null} onClick={() => setCheckout({ keys: [d.key], amount: d.amount, label: d.label })}><Smartphone className="mr-2 h-4 w-4" />Pay {inr(d.amount)} via UPI</Button>}
      </article>); })}</div>
    <Dialog open={!!checkout} onOpenChange={(o) => { if (!o && busy !== "upi") setCheckout(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Pay via UPI</DialogTitle><DialogDescription>{checkout?.label} · <span className="font-semibold text-foreground">{checkout && inr(checkout.amount)}</span> to GM University (gmuniversity@upi)</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-2">{UPI_APPS.map((a) => <button key={a} type="button" onClick={() => setApp(a)} className={`rounded-lg border px-3 py-2 text-sm ${app === a ? "border-primary bg-primary/10 font-semibold" : "hover:bg-muted"}`}>{a}</button>)}</div>
        <label className="text-sm font-medium" htmlFor="upi-id">Your UPI ID</label>
        <Input id="upi-id" placeholder="name@okaxis" value={vpa} onChange={(e) => setVpa(e.target.value)} />
        <Button disabled={busy === "upi"} onClick={confirmUpi}>{busy === "upi" ? "Waiting for UPI approval…" : `Pay ${checkout ? inr(checkout.amount) : ""}`}</Button>
      </DialogContent>
    </Dialog>
    <p className="mt-6 text-xs text-muted-foreground">Payments are credited to the GM University admin account. Sample flow — no real money is charged.</p>
  </>;
}
