import { useEffect, useState } from "react";
import { Bell, CheckCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCampus } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { leaveNotifications, notificationAccount, type FacultyLeave, type LeaveNotification } from "@/lib/leave-notifications";

const demoRead = new Map<string, string[]>();
export function LeaveNotificationBell({ onNavigate }: { onNavigate: (target: LeaveNotification["target"]) => void }) {
  const { session, studentLeaves, demoFacultyLeaves } = useCampus();
  const [facultyLeaves, setFacultyLeaves] = useState<FacultyLeave[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const account = session ? notificationAccount(session) : "";
  const key = `gmu.leaveNotifications.read:${account}`;
  useEffect(() => {
    if (session?.isDemo) { setRead(demoRead.get(account) ?? []); return; }
    try { setRead(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setRead([]); }
  }, [key, account, session?.isDemo]);
  useEffect(() => {
    if (!session || session.isDemo || session.role !== "Faculty") return;
    let active = true;
    const load = async () => {
      const result = await supabase.from("faculty_leave_requests").select("*").eq("faculty_id", session.facultyId ?? "").order("created_at", { ascending: false });
      if (!active) return;
      setError(Boolean(result.error)); if (!result.error) setFacultyLeaves(result.data);
    };
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    window.addEventListener("focus", load);
    window.addEventListener("gmu:faculty-leave-updated", load);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", load); window.removeEventListener("gmu:faculty-leave-updated", load); };
  }, [account, session?.isDemo]);
  if (!session || session.role === "Admin") return null;
  const notifications = leaveNotifications(session, studentLeaves, session.isDemo ? demoFacultyLeaves : facultyLeaves).sort((a, b) => b.date.localeCompare(a.date));
  const unread = notifications.filter((n) => !read.includes(n.id)).length;
  const markRead = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])]; setRead(next);
    if (session.isDemo) demoRead.set(account, next); else localStorage.setItem(key, JSON.stringify(next));
  };
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button size="icon" variant="outline" className="relative shrink-0" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} title="Leave notifications"><Bell className="h-5 w-5" />{unread > 0 && <span aria-hidden="true" className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">{unread > 99 ? "99+" : unread}</span>}</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
      <div className="flex items-center justify-between gap-2 border-b p-4"><h2 className="font-semibold">Notifications</h2><Button variant="ghost" size="icon" title="Mark all as read" aria-label="Mark all notifications as read" disabled={!unread} onClick={() => markRead(notifications.map((n) => n.id))}><CheckCheck className="h-4 w-4" /></Button></div>
      <div className="max-h-96 overflow-y-auto">{error && <p role="alert" className="p-4 text-sm text-destructive">Could not refresh leave decisions.</p>}{!notifications.length && <p className="p-5 text-sm text-muted-foreground">No leave decisions yet.</p>}{notifications.map((n) => <Button key={n.id} variant="ghost" className={`h-auto w-full justify-start gap-3 whitespace-normal rounded-none border-b p-4 text-left ${read.includes(n.id) ? "" : "bg-info/10"}`} onClick={() => { markRead([n.id]); setOpen(false); onNavigate(n.target); }}>
        {n.status === "Approved" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
        <span className="min-w-0"><span className="block font-semibold">{n.title}</span><span className="mt-1 block break-words text-xs font-normal text-muted-foreground">{n.detail}</span></span>{!read.includes(n.id) && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-info" />}
      </Button>)}</div>
    </PopoverContent>
  </Popover>;
}