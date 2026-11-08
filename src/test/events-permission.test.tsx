import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsTab } from "@/components/EventsTab";
import { CampusProvider, useCampus } from "@/lib/store";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(async () => ({ data: { user: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { sub: null, subscription: { unsubscribe: vi.fn() } } })),
  signOut: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));

async function openDemo(role: "Admin" | "Faculty" | "Student") {
  let campus: ReturnType<typeof useCampus> | undefined;
  function Probe() {
    campus = useCampus();
    return null;
  }
  render(
    <CampusProvider>
      <Probe />
      <EventsTab />
    </CampusProvider>,
  );
  await waitFor(() => expect(campus?.ready).toBe(true));
  act(() => campus!.startDemo(role));
  await screen.findByText("Live Events");
}

describe("Live Events editing permission", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("lets the Admin add and update events", async () => {
    await openDemo("Admin");
    expect(await screen.findByRole("button", { name: /Add event/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Edit/ }).length).toBeGreaterThan(0);
    expect(screen.getByText("You can add and update events.")).toBeTruthy();
    expect(screen.queryByText("Only admins can add or update events.")).toBeNull();
  });

  it("shows Faculty the events read-only", async () => {
    await openDemo("Faculty");
    expect(screen.queryByRole("button", { name: /Add event/ })).toBeNull();
    expect(screen.queryAllByRole("button", { name: /Edit/ })).toHaveLength(0);
    expect(screen.getByText("Only admins can add or update events.")).toBeTruthy();
  });

  it("shows Students the events read-only", async () => {
    await openDemo("Student");
    expect(screen.queryByRole("button", { name: /Add event/ })).toBeNull();
    expect(screen.queryAllByRole("button", { name: /Edit/ })).toHaveLength(0);
    expect(screen.getByText("Only admins can add or update events.")).toBeTruthy();
  });
});
