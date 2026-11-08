import { describe, expect, it } from "vitest";
import { attendanceDayStatus, calendarDays, defaultAttendanceSubject, type DailyAttendanceRecord } from "@/lib/daily-attendance";
const records: DailyAttendanceRecord[] = [
  { date: "2026-11-02", day: "MON", subject: "Python", year: 1, marks: { A: true, B: false } },
  { date: "2026-11-03", day: "TUE", subject: "Python", year: 1, marks: { A: false } },
];
const status = (date: string, subject = "Python", year = 1, id = "A") => attendanceDayStatus(records, date, subject, year, id, "2026-11-07");
describe("Student daily calendar", () => {
  it("opens today's submitted subject rather than an unmarked default subject", () => {
    const submitted: DailyAttendanceRecord[] = [
      { date: "2026-11-07", day: "SAT", subject: "Data Structures", year: 1, marks: { A: true, B: false } },
      { date: "2026-11-06", day: "FRI", subject: "DBMS", year: 1, marks: { A: true } },
    ];
    const subject = defaultAttendanceSubject(submitted, 1, "A", "2026-11-07", "Mathematics");
    expect(subject).toBe("Data Structures");
    expect(attendanceDayStatus(submitted, "2026-11-07", subject, 1, "A", "2026-11-07")).toBe("Present");
    expect(attendanceDayStatus(submitted, "2026-11-07", subject, 1, "B", "2026-11-07")).toBe("Absent");
  });
  it("chooses only the student's own year and marks when opening a submitted subject", () => {
    expect(defaultAttendanceSubject(records, 2, "A", "2026-11-07", "Mathematics")).toBe("Mathematics");
    expect(defaultAttendanceSubject(records, 1, "C", "2026-11-07", "Mathematics")).toBe("Mathematics");
    expect(defaultAttendanceSubject(records, 1, "A", "2026-11-07", "Mathematics")).toBe("Python");
  });
  it("shows submitted present days as Present", () => { expect(status("2026-11-02")).toBe("Present"); });
  it("shows submitted absent days as Absent", () => { expect(status("2026-11-03")).toBe("Absent"); });
  it("keeps missing attendance separate from actual absence", () => { expect(status("2026-11-04")).toBe("Not marked"); });
  it("isolates subject, year and student marks", () => {
    expect(status("2026-11-02", "DBMS")).toBe("Not marked");
    expect(status("2026-11-02", "Python", 2)).toBe("Not marked");
    expect(status("2026-11-02", "Python", 1, "B")).toBe("Absent");
    expect(status("2026-11-02", "Python", 1, "C")).toBe("Not marked");
  });
  it("does not count future days as missed attendance", () => { expect(status("2026-11-09")).toBe("Upcoming"); });
  it("retains Sunday as the existing attendance holiday", () => { expect(status("2026-11-01")).toBe("Holiday"); });
  it("uses the selected month's actual days and Monday-first offset", () => {
    expect(calendarDays("2026-11").dates).toHaveLength(30);
    expect(calendarDays("2026-11").offset).toBe(6);
    expect(calendarDays("2028-02").dates).toHaveLength(29);
  });
});