import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { signInIdentifier } from "./login-id";

export const signInWithCampusId = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string }) => {
    if (typeof input?.identifier !== "string" || typeof input?.password !== "string" || input.password.length < 8 || input.password.length > 64) throw new Error("Enter your sign-in ID and password.");
    return { identifier: signInIdentifier(input.identifier), password: input.password };
  })
  .handler(async ({ data }) => {
    // Public credential exchange only: never return the private ID/email mapping.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: allowed, error: limitError } = await supabaseAdmin.rpc("consume_campus_login_attempt", { _login_id: data.identifier });
    if (limitError) return { session: null, error: "Sign-in is temporarily unavailable." };
    if (!allowed) return { session: null, error: "Too many attempts. Please wait one minute." };
    const { data: email, error: lookupError } = await supabaseAdmin.rpc("resolve_campus_login", { _login_id: data.identifier });
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return { session: null, error: "Sign-in is temporarily unavailable." };
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    // Unknown IDs still run a password check, with the same generic response.
    const result = await client.auth.signInWithPassword({ email: !lookupError && email ? email : "unknown-login@campus.invalid", password: data.password });
    if (lookupError || !email || result.error || !result.data.session) return { session: null, error: "Invalid ID or password, or account not confirmed." };
    return { session: { access_token: result.data.session.access_token, refresh_token: result.data.session.refresh_token }, error: null };
  });