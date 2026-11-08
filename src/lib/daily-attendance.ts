export const ATTENDANCE_KEY = "gmu.dailyAttendance";
export interface DailyAttendanceRecord {
  date: string;
  day: string;
  subject: string;
  year?: number;
  marks: Record<string, boolean>;
}
export interface AttendanceMark { date: string; subject: string; year: number; student_id: string; present: boolean }
export function attendanceRows(records: DailyAttendanceRecord[]): AttendanceMark[] {
  return records.flatMap((r) => Object.entries(r.marks).map(([student_id, present]) => ({ date: r.date, subject: r.subject, year: r.year ?? 0, student_id, present })));
}
export function attendanceSheets(rows: AttendanceMark[]): DailyAttendanceRecord[] {
  const sheets = new Map<string, DailyAttendanceRecord>();
  for (const row of rows) {
    const key = `${row.date}/${row.subject}/${row.year}`;
    let sheet = sheets.get(key);
    if (!sheet) {
      sheet = { date: row.date, day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(`${row.date}T00:00:00`).getDay()] ?? "", subject: row.subject, year: row.year, marks: {} };
      sheets.set(key, sheet);
    }
    sheet.marks[row.student_id] = row.present;
  }
  return [...sheets.values()];
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function defaultAttendanceSubject(records: DailyAttendanceRecord[], year: number, studentId: string, today: string, fallback: string): string {
  const latest = records
    .filter((record) => record.year === year && typeof record.marks[studentId] === "boolean" && record.date <= today)
    .reduce<DailyAttendanceRecord | undefined>((saved, record) => !saved || record.date > saved.date ? record : saved, undefined);
  return latest?.subject ?? fallback;
}
export function calendarDays(month: string) {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const count = new Date(year, m, 0).getDate();
  return { offset: (new Date(year, m - 1, 1).getDay() + 6) % 7, dates: Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`) };
}
export function attendanceDayStatus(records: DailyAttendanceRecord[], date: string, subject: string, year: number, studentId: string, today: string): "Present" | "Absent" | "Not marked" | "Holiday" | "Upcoming" {
  if (date > today) return "Upcoming";
  const record = records.find((r) => r.date === date && r.subject === subject && (r.year ?? 0) === year);
  if (record && typeof record.marks[studentId] === "boolean") return record.marks[studentId] ? "Present" : "Absent";
  if (new Date(`${date}T00:00:00`).getDay() === 0) return "Holiday";
  return "Not marked";
}