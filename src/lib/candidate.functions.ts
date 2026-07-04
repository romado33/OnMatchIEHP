import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Returns a candidate's full profile data for the employer view.
 *  Uses supabaseAdmin to bypass RLS — only call from server-side contexts.
 */
export const getCandidateProfile = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = data;

    const [profileRes, proRes, credsRes, langsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url, created_at").eq("id", userId).single(),
      supabaseAdmin.from("professional_profiles").select("*").eq("user_id", userId).single(),
      supabaseAdmin
        .from("professional_credentials")
        .select("id, step_id, status, started_at, completed_at, notes, ref_credential_steps(step_number, title, description, governing_body, typical_duration_weeks, is_required)")
        .eq("user_id", userId)
        .order("step_id"),
      supabaseAdmin
        .from("professional_language_proficiencies")
        .select("language_code, proficiency_level, test_id, test_score, test_date")
        .eq("user_id", userId),
    ]);

    return {
      profile: profileRes.data,
      proProfile: proRes.data,
      credentials: credsRes.data ?? [],
      languages: langsRes.data ?? [],
    };
  });

/** Returns an employer's org profile for the candidate view.
 *  Uses supabaseAdmin to bypass RLS — only call from server-side contexts.
 */
export const getEmployerProfile = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = data;

    const [profileRes, empRes, jobsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at").eq("id", userId).single(),
      supabaseAdmin.from("employer_profiles").select("*").eq("user_id", userId).single(),
      supabaseAdmin
        .from("job_postings")
        .select("id, title, city, employment_type, description, created_at, status")
        .eq("employer_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    return {
      profile: profileRes.data,
      empProfile: empRes.data,
      jobs: jobsRes.data ?? [],
    };
  });
