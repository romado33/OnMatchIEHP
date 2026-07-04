import { createServerFn } from "@tanstack/react-start";

const IEHP_EMAIL = "demo-iehp@onmatch.demo";
const HR_EMAIL = "demo-hr@onmatch.demo";
const DEMO_PASSWORD = "DemoPass123!";

export const DEMO_CREDENTIALS = {
  iehp: { email: IEHP_EMAIL, password: DEMO_PASSWORD },
  hr: { email: HR_EMAIL, password: DEMO_PASSWORD },
};

export const seedDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function ensureUser(email: string, fullName: string) {
    // Try to find existing user by listing (admin API has no direct lookup-by-email).
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) return existing.id;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message}`);
    return data.user.id;
  }

  // ── IEHP demo user ─────────────────────────────────────────────────────
  const iehpId = await ensureUser(IEHP_EMAIL, "[DEMO] Priya Sharma");

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: iehpId, email: IEHP_EMAIL, full_name: "[DEMO] Priya Sharma", account_type: "professional" });

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: iehpId, role: "professional" }, { onConflict: "user_id,role" });

  await supabaseAdmin.from("professional_profiles").upsert(
    {
      user_id: iehpId,
      profession: "Registered Nurse",
      specialty: "Intensive Care",
      country_of_training: "India",
      years_experience: 7,
      languages: ["English", "Hindi", "Punjabi"],
      credentials_status: "NNAS in progress",
      license_exam_status: "NCLEX-RN scheduled",
      currently_in_canada: true,
      current_city: "Mississauga",
      preferred_cities: ["Toronto", "Mississauga", "Brampton"],
      willing_to_relocate: true,
      desired_role_types: ["Acute care", "ICU"],
      desired_employment_types: ["full_time"],
      available_from: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      bio: "[DEMO DATA] Internationally educated ICU nurse with 7 years at a tertiary hospital in Mumbai. NNAS application in progress; NCLEX-RN booked. Comfortable on vents, CRRT, and post-op cardiac care.",
      work_authorized_without_sponsorship: true,
      is_searchable: true,
    },
    { onConflict: "user_id" },
  );

  // ── HR / Employer demo user ────────────────────────────────────────────
  const hrId = await ensureUser(HR_EMAIL, "[DEMO] Alex Chen");

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: hrId, email: HR_EMAIL, full_name: "[DEMO] Alex Chen", account_type: "employer" });

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: hrId, role: "employer" }, { onConflict: "user_id,role" });

  await supabaseAdmin.from("employer_profiles").upsert(
    {
      user_id: hrId,
      org_name: "[DEMO] Lakeshore Regional Health",
      city: "Toronto",
      contact_name: "[DEMO] Alex Chen, Talent Acquisition",
      website: "https://example.com",
      about: "[DEMO DATA] A fictional community hospital network used to preview the employer experience.",
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      accepts_sponsored_workers: true,
    },
    { onConflict: "user_id" },
  );

  // Demo job posting (only insert if none exists for this employer)
  const { data: existingJob } = await supabaseAdmin
    .from("job_postings")
    .select("id")
    .eq("employer_id", hrId)
    .limit(1);

  if (!existingJob || existingJob.length === 0) {
    await supabaseAdmin.from("job_postings").insert({
      employer_id: hrId,
      title: "[DEMO] ICU Registered Nurse — Full Time",
      profession: "Registered Nurse",
      specialty: "Intensive Care",
      city: "Toronto",
      employment_type: "full_time",
      description:
        "[DEMO DATA] Join our 24-bed ICU at a fictional Toronto-area teaching hospital. Mix of medical, surgical, and post-cardiac patients. Strong preceptor program for internationally educated nurses.",
      requirements:
        "[DEMO] CNO registration or NCLEX-RN in progress. 2+ years ICU experience. Open to IEHPs completing NNAS.",
      is_active: true,
      open_to_sponsorship: true,
      moderation_status: "approved",
      positions_available: 3,
      benefits: ["Pension", "Health & dental", "Relocation support"],
    });
  }

  return { ok: true };
});