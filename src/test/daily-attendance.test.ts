import { describe, expect, it } from "vitest";
import { applyDay } from "@/components/DailyAttendanceTab";
const s = [{ id: "A", attended: 10, totalClasses: 12 }, { id: "B", attended: 5, totalClasses: 12 }] as never;
describe("applyDay", () => {
  it("adds one class, attended only when present", () => {
    const r = applyDay(s, { A: true, B: false }) as unknown as { attended: number; totalClasses: number }[];
    expect(r[0]).toMatchObject({ attended: 11, totalClasses: 13 }); expect(r[1]).toMatchObject({ attended: 5, totalClasses: 13 });
  });
  it("editing a day replaces, not double counts", () => {
    const r = applyDay(applyDay(s, { A: true }), { A: false }, { A: true }) as unknown as { attended: number; totalClasses: number }[];
    expect(r[0]).toMatchObject({ attended: 10, totalClasses: 13 });
  });
});
