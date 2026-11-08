import { expect, it, vi } from "vitest";

it("retains the campus context identity across hot module replacement", async () => {
  const first = await import("@/lib/campus-context");
  vi.resetModules();
  const updated = await import("@/lib/campus-context");
  expect(updated.campusContext).toBe(first.campusContext);
});