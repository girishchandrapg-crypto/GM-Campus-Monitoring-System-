import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampusProvider, useCampus } from "@/lib/store";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(async () => ({ data: { user: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { sub: null, subscription: { unsubscribe: vi.fn() } } })),
  signOut: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));

function setup() {
  let campus: ReturnType<typeof useCampus> | undefined;
  function Probe() { campus = useCampus(); return null; }
  render(<CampusProvider><Probe /></CampusProvider>);
  return () => {
    if (!campus) throw new Error("Provider not mounted");
    return campus;
  };
}

describe("Demo accounts", () => {
  it("opens a Faculty demo linked to FAC101 and Data Structures", async () => {
    const get = setup();
    await waitFor(() => expect(get().ready).toBe(true));
    act(() => get().startDemo("Faculty"));
    expect(get().session).toMatchObject({ role:"Faculty",facultyId:"FAC101",subject:"Data Structures",isDemo:true });
  });
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
  it("opens the Admin sample account without a Cloud session and does not save edits", async () => {
    const get = setup();
    await waitFor(() => expect(get().ready).toBe(true));
    act(() => get().startDemo("Admin"));
    expect(get().session).toMatchObject({ role: "Admin", name: "Girish Chandra PG", isDemo: true });
    expect(get().students).toHaveLength(96);
    act(() => get().setStudents([]));
    expect(get().students).toHaveLength(0);
    expect(localStorage.getItem("gmu.students")).toBeNull();
    await act(async () => get().logout());
    expect(get().session).toBeNull();
    expect(auth.signOut).not.toHaveBeenCalled();
  });
  it("links the Student sample account to GMU2301", async () => {
    const get = setup();
    await waitFor(() => expect(get().ready).toBe(true));
    act(() => get().startDemo("Student"));
    expect(get().session).toMatchObject({ role: "Student", studentId: "GMU2301", isDemo: true });
    expect(get().students.find((s) => s.id === get().session?.studentId)?.name).toBe("Aarav Patil");
  });
});