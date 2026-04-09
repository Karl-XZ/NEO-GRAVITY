import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client (service role) — bypasses RLS.
 * Only use server-side. Never expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
