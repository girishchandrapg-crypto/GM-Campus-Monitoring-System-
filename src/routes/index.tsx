import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Brain, BarChart3, MessageSquareText, Lock } from "lucide-react";
import gmuLogo from "@/assets/gm-university-logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCampus } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { signInWithCampusId } from "@/lib/login.functions";
import { normalizeLoginId, signInIdentifier } from "@/lib/login-id";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GMU Smart Campus – Sign in" },
      { name: "description", content: "AI-enabled Smart Campus Monitoring and Intelligent Student Support System for GM University, Davangere." },
      { property: "og:title", content: "GMU Smart Campus – AI Student Support" },
      { property: "og:description", content: "Attendance, performance, NLP feedback analysis, risk classification and recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { i: BarChart3, t: "Attendance & Performance", d: "Live percentages, weak subjects, grade bands." },
  { i: MessageSquareText, t: "NLP Feedback Analysis", d: "Cleaning, tokens, keywords, sentiment, category." },
  { i: Brain, t: "AI Risk & Recommendations", d: "Low, Moderate, High risk and Support Required." },
  { i: ShieldCheck, t: "Role-based Access", d: "Secure accounts for Admin and Students." },
];

function Index() {
  const { session, ready } = useCampus();
  const nav = useNavigate();
  const signIn = useServerFn(signInWithCampusId);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [sid, setSid] = useState("");
  const [kind, setKind] = useState<"student" | "faculty" | "admin">("student");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (ready && session) nav({ to: "/app" }); }, [ready, session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Enter a password of at least 8 characters.");
    let identifier = "";
    let fullName = name.trim().replace(/\s+/g, " ");
    if (mode === "in") {
      try { identifier = signInIdentifier(sid); } catch (error) { return setErr(error instanceof Error ? error.message : "Enter a valid ID."); }
    } else if (kind === "student") {
      try { identifier = normalizeLoginId(sid); } catch { return setErr("Enter your USN (letters and numbers)."); }
      if (fullName.length < 2) return setErr("Enter your full name.");
    } else if (kind === "faculty") {
      if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(fullName)) return setErr("Enter your name (letters only).");
    } else {
      const id = sid.trim();
      if (!/^[A-Z][A-Z0-9_-]{1,29}$/.test(id)) return setErr("Admin name must be in CAPITAL letters only.");
      identifier = id; fullName = id;
    }
    if (mode === "up" && !email.trim()) return setErr("Enter your email for account verification.");
    setBusy(true);
    try {
    if (mode === "in") {
      const result = await signIn({ data: { identifier, password: pw } });
      if (result.error) setErr(result.error);
      else if (result.session) {
        const { error } = await supabase.auth.setSession(result.session);
        if (error) setErr(error.message);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password: pw,
        options: { emailRedirectTo: window.location.origin, data: kind === "faculty" ? { full_name: fullName, account_type: "faculty" } : { full_name: fullName, login_id: identifier, student_id: kind === "student" ? identifier : undefined, account_type: kind } },
      });
      if (error) setErr(error.message);
      else if (!data.session) { toast.success("Check your email to confirm your account."); setMode("in"); }
    }
    } catch { setErr("Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      <section className="bg-hero relative flex flex-col justify-between overflow-hidden p-8 text-primary-foreground lg:p-14">
        <div className="flex items-center gap-3">
          <img src={gmuLogo} alt="GM University logo" className="h-11 w-11 rounded-lg bg-black object-contain shadow-lg" />
          <div>
            <p className="font-display text-xl font-bold">GM University</p>
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Davangere · Smart Campus</p>
          </div>
        </div>
        <div className="fade-up my-12 max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-accent">AI-Enabled Decision Support</p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Campus Management System</h1>
          <p className="mt-6 text-lg opacity-80">Monitor attendance, academics and feedback in one place — and let intelligent analysis surface who needs support, and how.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ i: I, t, d }) => (
            <div key={t} className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4 backdrop-blur">
              <I className="mb-2 h-5 w-5 text-accent" />
              <p className="font-semibold">{t}</p>
              <p className="text-sm opacity-70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="fade-up w-full max-w-sm">
          <img src={gmuLogo} alt="GM University logo" className="mb-4 h-20 w-20 rounded-xl bg-black object-contain shadow-lg" />
          <h2 className="text-3xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Welcome back to GMU Campus." : "Choose who you are, then fill in your details."}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "up" && <>
              <div className="space-y-2"><Label>I am a</Label>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
                  {(["student", "faculty", "admin"] as const).map((k) => (
                    <Button key={k} type="button" role="radio" aria-checked={kind === k} variant={kind === k ? "default" : "outline"} onClick={() => { setKind(k); setErr(null); }} className="capitalize">{k}</Button>
                  ))}
                </div>
              </div>
              {kind !== "admin" && <div className="space-y-2"><Label htmlFor="n">{kind === "faculty" ? "Your name (used to sign in)" : "Full name"}</Label><Input id="n" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>}
              {kind === "faculty" && <p className="text-xs text-muted-foreground">Admin must enable your faculty login before you can sign in.</p>}
            </>}
            {(mode === "in" || kind !== "faculty") && <div className="space-y-2"><Label htmlFor="s">{mode === "in" ? "Sign-in ID" : kind === "admin" ? "Admin name (CAPITAL letters)" : "USN"}</Label><Input id="s" autoComplete="username" required maxLength={60} value={sid} onChange={(e) => setSid(kind === "admin" && mode === "up" ? e.target.value.toUpperCase() : e.target.value)} /></div>}
            {mode === "up" && <div className="space-y-2"><Label htmlFor="e">Verification email</Label><Input id="e" type="email" autoComplete="email" required maxLength={80} value={email} onChange={(e) => setEmail(e.target.value)} /></div>}
            <div className="space-y-2"><Label htmlFor="p">Password</Label><Input id="p" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} maxLength={64} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy}><Lock className="mr-2 h-4 w-4" />{mode === "in" ? "Sign in" : "Sign up"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "in" ? "New here? " : "Already have an account? "}
            <button type="button" className="font-semibold text-accent hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }}>{mode === "in" ? "Create an account" : "Sign in"}</button>
          </p>
        </div>
      </section>
    </div>
  );
}
