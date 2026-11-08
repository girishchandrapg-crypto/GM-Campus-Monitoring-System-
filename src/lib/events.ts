export interface CampusEvent { id: string; title: string; start: string; end: string; time?: string; venue: string; category: string; desc: string }
export const EVENTS: CampusEvent[] = [
  { id: "E1", title: "Kannada Kala Vaibhava", start: "2026-11-21", end: "2026-11-21", venue: "Main Auditorium", category: "Cultural", desc: "Celebration of Kannada art, music, Yakshagana and folk dance." },
  { id: "E2", title: "Ignitron", start: "2026-12-03", end: "2026-12-03", venue: "Engineering Block Grounds", category: "Technical Fest", desc: "Flagship tech fest with project expo, robotics and coding contests." },
  { id: "E3", title: "Kannada Rajyotsava Week", start: "2026-11-01", end: "2026-11-07", venue: "Campus wide", category: "Cultural", desc: "Week-long Rajyotsava celebrations with flag hoisting and programmes." },
  { id: "E4", title: "AI & Data Science Workshop", start: "2026-11-05", end: "2026-11-06", venue: "Seminar Hall 2", category: "Workshop", desc: "Hands-on Python, Pandas and machine learning workshop." },
  { id: "E5", title: "Inter-Department Cricket League", start: "2026-11-10", end: "2026-11-15", venue: "University Sports Ground", category: "Sports", desc: "T20 league between all departments." },
  { id: "E6", title: "Hackathon 24hr — Code Davangere", start: "2026-11-14", end: "2026-11-15", venue: "CSE Labs", category: "Technical", desc: "24-hour hackathon on smart campus and agritech themes." },
  { id: "E7", title: "Blood Donation Camp", start: "2026-11-18", end: "2026-11-18", venue: "Health Centre", category: "Social", desc: "NSS blood donation camp with district hospital." },
  { id: "E8", title: "Placement Drive — Infosys", start: "2026-11-26", end: "2026-11-27", venue: "Placement Cell", category: "Placement", desc: "Campus recruitment for final-year students." },
  { id: "E9", title: "Annual Science Exhibition", start: "2026-12-10", end: "2026-12-11", venue: "Exhibition Hall", category: "Academic", desc: "Student science models and research posters." },
  { id: "E10", title: "GMU Annual Day", start: "2026-12-19", end: "2026-12-19", venue: "Open Air Theatre", category: "Cultural", desc: "Annual day celebrations, awards and cultural night." },
];
export type EventStatus = "Live" | "Upcoming" | "Completed";
export function eventStatus(e: CampusEvent, today: string): EventStatus {
  return today < e.start ? "Upcoming" : today > e.end ? "Completed" : "Live";
}
