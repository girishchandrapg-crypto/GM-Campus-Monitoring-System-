import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const enableFacultyLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string; facultyId: string; subject: string }) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !/^FAC\d{3,5}$/.test(data.facultyId) || !data.subject.trim()) throw new Error("Invalid faculty details.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !admin) throw new Error("Only administrators can enable faculty login.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("grant_faculty_access", { _email: data.email, _faculty_id: data.facultyId, _subject: data.subject });
    if (result.error) throw new Error("Could not enable faculty login. Check that the ID is not already assigned.");
    return { enabled: result.data };
  });