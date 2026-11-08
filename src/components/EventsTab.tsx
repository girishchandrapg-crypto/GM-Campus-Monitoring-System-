import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampus } from "@/lib/store";
import type { CampusEvent } from "@/lib/events";
import { Badge } from "@/components/ui/badge";
import { EVENTS, eventStatus } from "@/lib/events";

export function EventsTab() {
  const { session } = useCampus();
  const admin = session?.role === "Admin";
  const [events, setEvents] = useState<CampusEvent[]>(EVENTS);
  const [edit, setEdit] = useState<CampusEvent | null>(null);
  useEffect(() => { if (session?.isDemo) return; try { setEvents(JSON.parse(localStorage.getItem("gmu.events") || "null") ?? EVENTS); } catch { setEvents(EVENTS); } }, [session?.isDemo]);
  const save = () => {
    if (!admin || !edit) return;
    const e = { ...edit, title: edit.title.trim(), venue: edit.venue.trim() };
    if (e.title.length < 3) return void toast.error("Event name must be at least 3 characters.");
    if (!e.start || !e.end || e.end < e.start) return void toast.error("End date must be on or after start date.");
    if (!e.venue) return void toast.error("Place is required.");
    const next = events.some((x) => x.id === e.id) ? events.map((x) => (x.id === e.id ? e : x)) : [...events, e];
    setEvents(next); if (!session?.isDemo) localStorage.setItem("gmu.events", JSON.stringify(next));
    toast.success("Event saved"); setEdit(null);
  };
  const set = (k: keyof CampusEvent, v: string) => edit && setEdit({ ...edit, [k]: v });
  const today = new Date().toISOString().slice(0, 10);
  const rows = events.map((e) => ({ ...e, status: eventStatus(e, today) })).sort((a, b) => a.start.localeCompare(b.start));
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const section = (title: string, list: typeof rows) => list.length > 0 && <section className="mb-8"><h2 className="mb-3 font-display text-xl font-semibold">{title} ({list.length})</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((e) => (
    <article key={e.id} className={`rounded-xl border bg-card p-5 shadow-sm ${e.status === "Live" ? "border-destructive/50 ring-2 ring-destructive/20" : ""}`}>
      <div className="flex items-center justify-between gap-2"><Badge variant="outline">{e.category}</Badge>
        <Badge variant="outline" className={e.status === "Live" ? "bg-destructive/15 text-destructive" : e.status === "Upcoming" ? "bg-success/15 text-success" : "text-muted-foreground"}>{e.status === "Live" ? "● LIVE NOW" : e.status}</Badge></div>
      <h3 className="mt-3 text-lg font-semibold">{e.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
      <p className="mt-3 flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" />{fmt(e.start)}{e.end !== e.start && ` – ${fmt(e.end)}`}</p>
      {e.time && <p className="mt-1 flex items-center gap-2 text-sm"><Clock className="h-4 w-4" />{e.time}</p>}
      <p className="mt-1 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{e.venue}</p>
      {admin && <Button size="sm" variant="outline" className="mt-3" onClick={() => setEdit({ ...e })}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}
    </article>))}</div></section>;
  return <>
    <header className="mb-6"><h1 className="font-display text-2xl font-bold">Live Events</h1><p className="text-sm text-muted-foreground">Events happening now and coming up at GM University.</p><p className="mt-1 text-xs font-medium text-muted-foreground">{admin ? "You can add and update events." : "Only admins can add or update events."}</p></header>
    {admin && !edit && <Button className="mb-6" onClick={() => setEdit({ id: `E${Date.now()}`, title: "", start: today, end: today, time: "10:00", venue: "", category: "Cultural", desc: "" })}><Plus className="mr-1 h-4 w-4" />Add event</Button>}
    {edit && <div className="mb-8 rounded-xl border bg-card p-5 shadow-sm"><h3 className="mb-4 font-semibold">{events.some((x) => x.id === edit.id) ? "Edit event" : "New event"}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {([["Event name", "title", "text"], ["Start date", "start", "date"], ["End date", "end", "date"], ["Time", "time", "time"], ["Place", "venue", "text"], ["Category", "category", "text"]] as const).map(([l, k, t]) => <label key={k} className="space-y-1 text-xs font-medium text-muted-foreground"><span>{l}</span><Input type={t} value={edit[k] ?? ""} onChange={(ev) => set(k, ev.target.value)} /></label>)}
        <label className="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-3"><span>Description</span><Input maxLength={200} value={edit.desc} onChange={(ev) => set("desc", ev.target.value)} /></label>
      </div>
      <div className="mt-4 flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button></div></div>}
    {section("Happening now", rows.filter((e) => e.status === "Live"))}
    {section("Upcoming", rows.filter((e) => e.status === "Upcoming"))}
    {section("Completed", rows.filter((e) => e.status === "Completed"))}
  </>;
}
