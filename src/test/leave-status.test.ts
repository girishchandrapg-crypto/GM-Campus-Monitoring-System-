import { describe, expect, it } from "vitest";
import { leaveOverallStatus, type Leave } from "@/components/LeaveTab";

const base: Leave = {
  id: "LV1", studentId: "GMU2301", studentName: "Aarav", type: "Medical Leave",
  from: "2026-11-10", to: "2026-11-11", reason: "Medical appointment", submitted: "2026-11-07",
  teachers: [],
};
const t = (status: "Pending" | "Approved" | "Rejected") => ({ subject: "DS", teacher: "Rao", status });

describe("leaveOverallStatus", () => {
  it("is Pending when no teacher has decided", () => {
    expect(leaveOverallStatus({ ...base, teachers: [t("Pending"), t("Pending")] })).toBe("Pending");
  });
  it("is Accepted only when every teacher approved", () => {
    expect(leaveOverallStatus({ ...base, teachers: [t("Approved"), t("Approved")] })).toBe("Accepted");
  });
  it("is Rejected only when every teacher rejected", () => {
    expect(leaveOverallStatus({ ...base, teachers: [t("Rejected"), t("Rejected")] })).toBe("Rejected");
  });
  it("is Partially Approved for mixed decisions", () => {
    expect(leaveOverallStatus({ ...base, teachers: [t("Approved"), t("Rejected")] })).toBe("Partially Approved");
    expect(leaveOverallStatus({ ...base, teachers: [t("Approved"), t("Pending")] })).toBe("Partially Approved");
  });
});
