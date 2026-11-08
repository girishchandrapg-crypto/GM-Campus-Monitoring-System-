import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CampusProvider, useCampus } from "@/lib/store";
import { attendanceDayStatus, attendanceSheets } from "@/lib/daily-attendance";

const cloud = vi.hoisted(() => {
  const upsert = vi.fn(async () => ({ error: null }));
  const select = vi.fn(async () => ({ data: [], error: null }));
  return { upsert, select };
});
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: {
    getUser: async () => ({ data: { user: { id: "faculty-user", email: "faculty@example.test" } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: (table: string) => table === "attendance_marks" ? cloud : ({
    select: () => ({ eq: () => table === "profiles"
      ? { maybeSingle: async () => ({ data: { faculty_id: "FAC101", faculty_subject: "Data Structures" } }) }
      : Promise.resolve({ data: [{ role: "faculty" }] }) }),
  }),
} }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("persists faculty submitted present and absent marks to Cloud before calendar delivery", async () => {
  let campus: ReturnType<typeof useCampus> | undefined;
  function Probe() { campus = useCampus(); return null; }
  render(<CampusProvider><Probe /></CampusProvider>);
  await waitFor(() => expect(campus?.session?.role).toBe("Faculty"));
  await act(async () => { await campus?.setDailyAttendance([{ date: "2026-11-06", day: "FRI", subject: "Data Structures", year: 1, marks: { GMU2301: true, GMU2302: false } }]); });
  expect(cloud.upsert).toHaveBeenCalledWith([
    { date: "2026-11-06", subject: "Data Structures", year: 1, student_id: "GMU2301", present: true },
    { date: "2026-11-06", subject: "Data Structures", year: 1, student_id: "GMU2302", present: false },
  ], { onConflict: "date,subject,year,student_id" });
});

it("refreshes submitted attendance automatically when the window regains focus", async () => {
  let campus: ReturnType<typeof useCampus> | undefined;
  function Probe() { campus = useCampus(); return null; }
  render(<CampusProvider><Probe /></CampusProvider>);
  await waitFor(() => expect(cloud.select).toHaveBeenCalled());
  cloud.select.mockResolvedValueOnce({ data: [{ date: "2026-11-06", subject: "Data Structures", year: 1, student_id: "GMU2301", present: false }] as never[], error: null });
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(attendanceDayStatus(campus?.dailyAttendance ?? [], "2026-11-06", "Data Structures", 1, "GMU2301", "2026-11-07")).toBe("Absent");
});

it("keeps each student's submitted present or absent status separate", () => {
  const records = attendanceSheets([
    { date: "2026-11-06", subject: "Python", year: 2, student_id: "GMU2301", present: true },
    { date: "2026-11-06", subject: "Python", year: 2, student_id: "GMU2302", present: false },
  ]);
  expect(attendanceDayStatus(records, "2026-11-06", "Python", 2, "GMU2301", "2026-11-07")).toBe("Present");
  expect(attendanceDayStatus(records, "2026-11-06", "Python", 2, "GMU2302", "2026-11-07")).toBe("Absent");
});