import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Check, X } from "lucide-react";
import { useCampus } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { validateFacultyLeave } from "@/lib/faculty-leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";
type Leave = Database["public"]["Tables"]["faculty_leave_requests"]["Row"];
const today = () => new Date().toISOString().slice(0,10);
export function FacultyLeaveTab() {
  const { session, demoFacultyLeaves, setDemoFacultyLeaves } = useCampus();
  const [cloudList,setList] = useState<Leave[]>([]);
  const list = session?.isDemo ? demoFacultyLeaves : cloudList;
  const [form,setForm] = useState({ from: today(), to: today(), reason: "" });
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string | null>(null);
  const admin = session?.role === "Admin";
  const load = async () => {
    const result = await supabase.from("faculty_leave_requests").select("*").order("created_at",{ascending:false});
    if (result.error) setError("Could not load faculty leave letters."); else setList(result.data);
  };
  useEffect(() => { if (!session?.isDemo) void load(); }, [session?.isDemo,admin]);
  const submit = async () => {
    if (!session?.facultyId) return;
    const issue = validateFacultyLeave(form.from,form.to,form.reason,today());
    if (issue) { setError(issue); return; }
    setBusy(true); setError(null);
    try {
      if (session.isDemo) setDemoFacultyLeaves([{id:crypto.randomUUID(),user_id:"demo",faculty_id:session.facultyId,faculty_name:session.name,from_date:form.from,to_date:form.to,reason:form.reason.trim(),status:"Pending",created_at:new Date().toISOString()},...list]);
      else {
        const {data,error:authError} = await supabase.auth.getUser();
        if (authError || !data.user) throw new Error("Please sign in again.");
        const result = await supabase.from("faculty_leave_requests").insert({user_id:data.user.id,faculty_id:session.facultyId,faculty_name:session.name,from_date:form.from,to_date:form.to,reason:form.reason.trim()});
        if(result.error) throw new Error("Could not submit leave letter.");
        await load();
      }
      setForm({...form,reason:""});toast.success("Leave letter submitted to Admin.");
    } catch(e) {setError(e instanceof Error ? e.message : "Could not submit letter.");} finally {setBusy(false);}
  };
  const review = async (id:string,status:"Approved"|"Rejected") => {
    if (!admin) return;
    if (session?.isDemo) {setDemoFacultyLeaves(list.map((l)=>l.id===id?{...l,status}:l));return;}
    const result=await supabase.from("faculty_leave_requests").update({status}).eq("id",id);
    if(result.error) setError("Could not record the decision."); else { await load(); window.dispatchEvent(new Event("gmu:faculty-leave-updated")); }
  };
  return <section><h1 className="mb-6 font-display text-3xl font-bold">{admin?"Faculty Leave Letters":"Leave Letter to Admin"}</h1>
    {!admin && <div className="mb-8 max-w-2xl space-y-4"><div className="grid grid-cols-2 gap-4"><label className="text-sm">From<Input type="date" min={today()} value={form.from} onChange={(e)=>setForm({...form,from:e.target.value})}/></label><label className="text-sm">To<Input type="date" min={form.from} value={form.to} onChange={(e)=>setForm({...form,to:e.target.value})}/></label></div><label className="block text-sm">Reason<Textarea className="mt-2" rows={5} maxLength={500} value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})}/></label><Button disabled={busy} onClick={()=>void submit()}><Send className="mr-2 h-4 w-4"/>Submit leave letter</Button></div>}
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    <div className="space-y-4">{list.map((l)=><article key={l.id} className="rounded-lg border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><b>{l.faculty_name} · {l.faculty_id}</b><Badge variant="outline">{l.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{l.from_date} to {l.to_date}</p><p className="my-3 whitespace-pre-wrap">{l.reason}</p>{admin && l.status==="Pending" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>void review(l.id,"Approved")}><Check className="mr-1 h-4 w-4"/>Approve</Button><Button size="sm" variant="outline" onClick={()=>void review(l.id,"Rejected")}><X className="mr-1 h-4 w-4"/>Reject</Button></div>}</article>)}{!list.length && <p className="text-muted-foreground">No faculty leave letters yet.</p>}</div>
  </section>;
}