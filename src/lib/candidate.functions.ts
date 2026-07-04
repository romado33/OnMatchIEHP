import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CandidateProfileResult = {
  profile: { id: string; full_name: string | null; created_at: string } | null;
  proProfile: {
    profession: string | null;
    specialty: string | null;
    country_of_training: string | null;
    years_experience: number | null;
    bio: string | null;
    current_city: string | null;
    preferred_cities: string[] | null;
    willing_to_relocate: boolean | null;
    desired_role_types: string[] | null;
    desired_employment_types: string[] | null;
    available_from: string | null;
    completeness_score: number | null;
    profile_view_count: number | null;
    is_searchable: boolean | null;
    work_authorized_without_sponsorship: boolean | null;
    currently_in_canada: boolean | null;
    credentials_status: string | null;
    license_exam_status: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
  } | null;
  credentials: {
    id: string;
    step_id: string | null;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    notes: string | null;
    ref_credential_steps: {
      step_order: number;
      step_name: string;
      description: string | null;
      governing_body: string | null;
      typical_duration_weeks: number | null;
    } | null;
  }[];
  languages: {
    language_code: string;
    proficiency_level: string | null;
    test_id: string | null;
    test_score: string | null;
    test_date: string | null;
  }[];
};

export type EmployerProfileResult = {
  profile: { id: string; full_name: string | null; created_at: string } | null;
  empProfile: {
    org_name: string;
    org_type: string | null;
    city: string | null;
    website: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    about: string | null;
  } | null;
  jobs: {
    id: string;
    title: string;
    city: string | null;
    employment_type: string | null;
    description: string | null;
    created_at: string;
    is_active: boolean;
  }[];
};

export type MyProStatsResult = {
  profession: string | null;
  country_of_training: string | null;
  years_experience: number | null;
  bio: string | null;
  current_city: string | null;
  available_from: string | null;
  desired_employment_types: string[] | null;
  completeness_score: number;
  profile_view_count: number;
  is_searchable: boolean;
  credentials_done: number;
};

/** Fetches a professional's own KPI stats using supabaseAdmin to bypass RLS. */
export const getMyProStats = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }): Promise<MyProStatsResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = data;

    const [proRes, credsDoneRes] = await Promise.all([
      supabaseAdmin
        .from("professional_profiles")
        .select(
          "profession, country_of_training, years_experience, bio, current_city, " +
            "available_from, desired_employment_types, completeness_score, " +
            "profile_view_count, is_searchable",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("professional_credentials")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .in("status", ["completed", "waived"]),
    ]);

    const p = proRes.data;
    const credsDone = credsDoneRes.count ?? 0;

    // Compute completeness from actual data rather than cached DB value
    const fields = [
      p?.profession,
      p?.country_of_training,
      p?.years_experience != null && p.years_experience > 0,
      p?.bio,
      p?.current_city,
      p?.available_from,
      p?.desired_employment_types?.length,
    ];
    const filled = fields.filter(Boolean).length;
    const fieldScore = Math.round((filled / fields.length) * 60);
    const credScore = Math.min(Math.round((credsDone / 9) * 40), 40);
    const computedScore = Math.min(fieldScore + credScore, 100);

    return {
      profession: p?.profession ?? null,
      country_of_training: p?.country_of_training ?? null,
      years_experience: p?.years_experience ?? null,
      bio: p?.bio ?? null,
      current_city: p?.current_city ?? null,
      available_from: p?.available_from ?? null,
      desired_employment_types: p?.desired_employment_types ?? null,
      completeness_score: computedScore || (p?.completeness_score ?? 0),
      profile_view_count: p?.profile_view_count ?? 0,
      is_searchable: p?.is_searchable ?? false,
      credentials_done: credsDone,
    };
  });

/** Returns a candidate's full profile data for the employer view.
 *  Uses supabaseAdmin to bypass RLS — only call from server-side contexts.
 */
export const getCandidateProfile = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }): Promise<CandidateProfileResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = data;

    const [profileRes, proRes, credsRes, langsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at").eq("id", userId).single(),
      supabaseAdmin
        .from("professional_profiles")
        .select(
          "profession, specialty, country_of_training, years_experience, bio, current_city, " +
            "preferred_cities, willing_to_relocate, desired_role_types, desired_employment_types, " +
            "available_from, completeness_score, profile_view_count, is_searchable, " +
            "work_authorized_without_sponsorship, currently_in_canada, credentials_status, " +
            "license_exam_status, linkedin_url, portfolio_url",
        )
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("professional_credentials")
        .select(
          "id, step_id, status, started_at, completed_at, notes, ref_credential_steps(step_order, step_name, description, governing_body, typical_duration_weeks)",
        )
        .eq("user_id", userId)
        .order("step_id"),
      supabaseAdmin
        .from("professional_language_proficiencies")
        .select("language_code, proficiency_level, test_id, test_score, test_date")
        .eq("user_id", userId),
    ]);

    return {
      profile: profileRes.data as CandidateProfileResult["profile"],
      proProfile: proRes.data as CandidateProfileResult["proProfile"],
      credentials: (credsRes.data ?? []) as CandidateProfileResult["credentials"],
      languages: (langsRes.data ?? []) as CandidateProfileResult["languages"],
    };
  });

/** Returns an employer's org profile for the candidate view.
 *  Uses supabaseAdmin to bypass RLS — only call from server-side contexts.
 */
export const getEmployerProfile = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }): Promise<EmployerProfileResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = data;

    const [profileRes, empRes, jobsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, created_at").eq("id", userId).single(),
      supabaseAdmin
        .from("employer_profiles")
        .select("org_name, org_type, city, website, contact_name, contact_phone, about")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("job_postings")
        .select("id, title, city, employment_type, description, created_at, is_active")
        .eq("employer_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

    return {
      profile: profileRes.data as EmployerProfileResult["profile"],
      empProfile: empRes.data as EmployerProfileResult["empProfile"],
      jobs: (jobsRes.data ?? []) as EmployerProfileResult["jobs"],
    };
  });
