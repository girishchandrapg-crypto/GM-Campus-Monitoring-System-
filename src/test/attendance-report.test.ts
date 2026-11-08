import { describe, expect, it } from "vitest";
import { attendanceReport } from "@/lib/attendance-report";
import { seedStudents } from "@/lib/campus";
describe("Submitted attendance reports", () => {
  it("counts submitted present and absent marks and excludes other years", () => {
    const roster = seedStudents().filter((s) => Math.ceil(s.sem / 2) === 1);
    const marks = Object.fromEntries(roster.map((s, i) => [s.id, i !== 0]));
    marks["OTHER_YEAR"] = true;
    const report = attendanceReport(roster, marks);
    expect(report.total).toBe(24); expect(report.present).toBe(23); expect(report.absent).toBe(1);
    expect(report.percentage).toBeCloseTo(95.8333);
  });
  it("replacing saved marks updates the report rather than adding another class", () => {
    const roster = seedStudents().slice(0, 1);
    const first = roster[0]; if (!first) throw new Error("Missing sample student");
    expect(attendanceReport(roster, { [first.id]: true }).present).toBe(1);
    expect(attendanceReport(roster, { [first.id]: false }).absent).toBe(1);
    expect(attendanceReport(roster, {}).total).toBe(0);
  });
});