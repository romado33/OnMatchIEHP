import { createServerFn } from "@tanstack/react-start";

const IEHP_EMAIL = "demo-iehp@onmatch.demo";
const HR_EMAIL = "demo-hr@onmatch.demo";
const DEMO_PASSWORD = "DemoPass123!";
const CONSENT_VERSION = "2026-06-24";

export const DEMO_CREDENTIALS = {
  iehp: { email: IEHP_EMAIL, password: DEMO_PASSWORD },
  hr: { email: HR_EMAIL, password: DEMO_PASSWORD },
};

export const seedDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = Date.now();

  async function ensureUser(email: string, fullName: string) {
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

  // ── IEHP demo user — Priya Sharma ─────────────────────────────────────────
  const iehpId = await ensureUser(IEHP_EMAIL, "[DEMO] Priya Sharma");

  await supabaseAdmin.from("profiles").upsert({
    id: iehpId,
    email: IEHP_EMAIL,
    full_name: "[DEMO] Priya Sharma",
    account_type: "professional",
  });

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
      credentials_status: "NCLEX-RN scheduled",
      license_exam_status: "NCLEX-RN booked — Aug 15, 2026, Pearson VUE Mississauga",
      currently_in_canada: true,
      current_city: "Mississauga",
      preferred_cities: ["Toronto", "Mississauga", "Brampton"],
      willing_to_relocate: true,
      desired_role_types: ["Acute care", "ICU"],
      desired_employment_types: ["full_time"],
      available_from: new Date(now + 75 * 86400000).toISOString().slice(0, 10),
      bio: "[DEMO DATA] ICU-trained RN from Mumbai with 7 years on a busy tertiary-care unit (ventilators, CRRT, post-cardiac surgery). NNAS advisory report received; CNO approved me to write NCLEX-RN. Exam booked August 2026. IELTS 8.0. Looking for a Toronto/GTA ICU with a strong preceptor program for IEHPs.",
      work_authorized_without_sponsorship: true,
      is_searchable: true,
      // completeness_score and profile_view_count are computed below after all related data is inserted
    },
    { onConflict: "user_id" },
  );

  // Language proficiencies (15 pts toward completeness: +8 first lang, +7 second)
  await supabaseAdmin.from("professional_language_proficiencies").delete().eq("user_id", iehpId);
  await supabaseAdmin.from("professional_language_proficiencies").insert([
    {
      user_id: iehpId,
      language_code: "en",
      proficiency_level: "native",
      test_id: "IELTS",
      test_score: "8.0 overall",
    },
    { user_id: iehpId, language_code: "hi", proficiency_level: "native" },
    { user_id: iehpId, language_code: "pa", proficiency_level: "professional" },
  ]);

  // Consent
  await supabaseAdmin.from("consent_records").delete().eq("user_id", iehpId);
  await supabaseAdmin.from("consent_records").insert([
    {
      user_id: iehpId,
      consent_type: "terms_of_service",
      version: CONSENT_VERSION,
      consented: true,
    },
    { user_id: iehpId, consent_type: "privacy_policy", version: CONSENT_VERSION, consented: true },
    { user_id: iehpId, consent_type: "ai_processing", version: CONSENT_VERSION, consented: true },
  ]);

  // Credential steps — full RN pathway (6 done, 1 in-progress, 2 pending)
  await supabaseAdmin.from("professional_credentials").delete().eq("user_id", iehpId);
  await supabaseAdmin.from("professional_credentials").insert([
    {
      user_id: iehpId,
      step_id: "rn_nnas_application",
      status: "completed",
      started_at: "2024-11-10",
      completed_at: "2024-11-18",
      notes: "Application submitted online with all supporting documents.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nnas_documents",
      status: "completed",
      started_at: "2024-11-18",
      completed_at: "2025-02-12",
      notes: "Uploaded degree, transcripts, IELTS (8.0), home-country RN registration.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nnas_assessment",
      status: "completed",
      started_at: "2025-02-12",
      completed_at: "2025-09-08",
      notes: "Credentials assessed as substantially equivalent to Canadian RN education.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nnas_advisory_report",
      status: "completed",
      started_at: "2025-09-08",
      completed_at: "2025-09-22",
      notes: "Advisory Report received and forwarded to CNO.",
    },
    {
      user_id: iehpId,
      step_id: "rn_cno_application",
      status: "completed",
      started_at: "2025-09-25",
      completed_at: "2026-01-20",
      notes: "CNO reviewed application and approved eligibility for NCLEX-RN.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nclex_rn_eligible",
      status: "completed",
      started_at: "2026-01-20",
      completed_at: "2026-01-28",
      notes: "Received CNO eligibility notification.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nclex_rn_registered",
      status: "in_progress",
      started_at: "2026-05-02",
      completed_at: null,
      notes: "Exam booked at Pearson VUE Mississauga — August 15, 2026. Studying with UWorld.",
    },
    {
      user_id: iehpId,
      step_id: "rn_nclex_rn_passed",
      status: "not_started",
      started_at: null,
      completed_at: null,
      notes: null,
    },
    {
      user_id: iehpId,
      step_id: "rn_cno_registered",
      status: "not_started",
      started_at: null,
      completed_at: null,
      notes: null,
    },
  ]);

  // Recompute completeness score now that all profile fields, languages, and credentials are in place
  await supabaseAdmin.rpc("calc_profile_completeness", { _user_id: iehpId });

  // Reset profile_view_count to 0 before re-inserting events so triggers give exact count
  await supabaseAdmin
    .from("professional_profiles")
    .update({ profile_view_count: 0 })
    .eq("user_id", iehpId);

  // Profile view events (5 this week, 4 older) — trigger increments profile_view_count on each INSERT
  await supabaseAdmin.from("profile_view_events").delete().eq("professional_user_id", iehpId);
  await supabaseAdmin.from("profile_view_events").insert([
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 0.5 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 1 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "job_application",
      viewed_at: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "shortlist",
      viewed_at: new Date(now - 6 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 14 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "direct_link",
      viewed_at: new Date(now - 21 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 25 * 86400000).toISOString(),
    },
    {
      professional_user_id: iehpId,
      view_source: "ai_search",
      viewed_at: new Date(now - 28 * 86400000).toISOString(),
    },
  ]);

  // Force-set KPI values unconditionally — don't rely on triggers or RPC
  // (the RPC was revoked in security_hardening; the trigger may not bypass RLS)
  await supabaseAdmin
    .from("professional_profiles")
    .update({ completeness_score: 90, profile_view_count: 9 })
    .eq("user_id", iehpId);

  // ── HR / Employer demo user — Alex Chen ───────────────────────────────────
  const hrId = await ensureUser(HR_EMAIL, "[DEMO] Alex Chen");

  await supabaseAdmin.from("profiles").upsert({
    id: hrId,
    email: HR_EMAIL,
    full_name: "[DEMO] Alex Chen",
    account_type: "employer",
  });

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: hrId, role: "employer" }, { onConflict: "user_id,role" });

  await supabaseAdmin.from("employer_profiles").upsert(
    {
      user_id: hrId,
      org_name: "[DEMO] Lakeshore Regional Health",
      city: "Toronto",
      contact_name: "[DEMO] Alex Chen — Talent Acquisition Manager",
      website: "https://example.com",
      about:
        "[DEMO DATA] A fictional 420-bed community teaching hospital in west Toronto with a 24-bed MSICU, a 32-bed ED, and three medical-surgical floors. Actively recruiting internationally educated nurses and allied health professionals.",
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      accepts_sponsored_workers: true,
    },
    { onConflict: "user_id" },
  );

  // Consent
  await supabaseAdmin.from("consent_records").delete().eq("user_id", hrId);
  await supabaseAdmin.from("consent_records").insert([
    { user_id: hrId, consent_type: "terms_of_service", version: CONSENT_VERSION, consented: true },
    { user_id: hrId, consent_type: "privacy_policy", version: CONSENT_VERSION, consented: true },
    { user_id: hrId, consent_type: "ai_processing", version: CONSENT_VERSION, consented: true },
  ]);

  // Job postings — wipe and re-create 3 roles
  await supabaseAdmin.from("job_postings").delete().eq("employer_id", hrId);
  const { data: jobData } = await supabaseAdmin
    .from("job_postings")
    .insert([
      {
        employer_id: hrId,
        title: "[DEMO] ICU Registered Nurse — Full Time",
        profession: "Registered Nurse",
        specialty: "Intensive Care",
        city: "Toronto",
        employment_type: "full_time",
        description:
          "[DEMO DATA] Join our 24-bed MSICU at Lakeshore Regional. Patient mix: medical, post-cardiac surgery, complex surgical. Vents, CRRT, PA catheters. Strong preceptor program for IEHPs; CNO registration support provided.",
        requirements:
          "[DEMO] CNO registration or NCLEX-RN in progress. Min 2 yrs ICU experience. BCLS required; ACLS preferred.",
        is_active: true,
        open_to_sponsorship: true,
        moderation_status: "approved",
        positions_available: 3,
        benefits: [
          "HOOPP Pension",
          "Health & dental",
          "Relocation allowance up to $3,000",
          "Paid orientation weeks",
        ],
      },
      {
        employer_id: hrId,
        title: "[DEMO] Emergency Department RN — Full Time",
        profession: "Registered Nurse",
        specialty: "Emergency",
        city: "Toronto",
        employment_type: "full_time",
        description:
          "[DEMO DATA] Fast-paced 32-bed ED with 85,000+ annual visits. Triage, resus bays, trauma, and fast-track. Strong collaborative team culture.",
        requirements:
          "[DEMO] CNO registration required. Min 1 yr ED or acute-care experience. BCLS/ACLS/TNCC preferred.",
        is_active: true,
        open_to_sponsorship: false,
        moderation_status: "approved",
        positions_available: 2,
        benefits: ["HOOPP Pension", "Health & dental", "Shift premiums"],
      },
      {
        employer_id: hrId,
        title: "[DEMO] Medical-Surgical RN — Part Time",
        profession: "Registered Nurse",
        specialty: "Medical-Surgical",
        city: "Mississauga",
        employment_type: "part_time",
        description:
          "[DEMO DATA] 36-bed med-surg unit at our Mississauga satellite site. Excellent mentorship for internationally educated nurses transitioning to Ontario practice.",
        requirements:
          "[DEMO] CNO registration required or in final stages. General med-surg experience preferred.",
        is_active: true,
        open_to_sponsorship: true,
        moderation_status: "approved",
        positions_available: 4,
        benefits: ["HOOPP Pension", "Health & dental"],
      },
    ])
    .select("id");

  const jobIds = jobData?.map((j) => j.id) ?? [];

  // AI search sessions (1 today for counter + 3 historical)
  await supabaseAdmin.from("ai_search_sessions").delete().eq("employer_user_id", hrId);
  await supabaseAdmin.from("ai_search_sessions").insert([
    {
      employer_user_id: hrId,
      query_text:
        "ICU nurse with NNAS completed, NCLEX booked, available within 3 months, Hindi or Punjabi speaker",
      results_returned: 4,
      candidate_pool_size: 23,
      model_used: "gpt-4o",
      latency_ms: 1840,
      created_at: new Date().toISOString(),
    },
    {
      employer_user_id: hrId,
      query_text:
        "Registered nurse cardiac care post-op experience, Toronto or Mississauga preferred",
      results_returned: 6,
      candidate_pool_size: 41,
      model_used: "gpt-4o",
      latency_ms: 2100,
      created_at: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      employer_user_id: hrId,
      query_text: "Bilingual French-English RN willing to relocate, med-surg or ICU background",
      results_returned: 2,
      candidate_pool_size: 14,
      model_used: "gpt-4o",
      latency_ms: 1650,
      created_at: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      employer_user_id: hrId,
      query_text: "Emergency nurse ACLS certified, 3+ years experience, Greater Toronto Area",
      results_returned: 3,
      candidate_pool_size: 18,
      model_used: "gpt-4o",
      latency_ms: 1980,
      created_at: new Date(now - 6 * 86400000).toISOString(),
    },
  ]);

  // Shortlist: Alex saved Priya
  await supabaseAdmin
    .from("shortlists")
    .delete()
    .eq("employer_user_id", hrId)
    .eq("professional_user_id", iehpId);
  await supabaseAdmin.from("shortlists").insert({
    employer_user_id: hrId,
    professional_user_id: iehpId,
    list_name: "ICU Candidates",
    notes:
      "[DEMO] Strong ICU background, NCLEX exam booked Aug 2026. Priority candidate — follow up after exam.",
  });

  // Application: Priya applied to Alex's ICU job
  if (jobIds.length > 0) {
    await supabaseAdmin
      .from("applications")
      .delete()
      .eq("applicant_user_id", iehpId)
      .eq("job_posting_id", jobIds[0]);
    await supabaseAdmin.from("applications").insert({
      applicant_user_id: iehpId,
      job_posting_id: jobIds[0],
      status: "under_review",
      cover_note:
        "[DEMO DATA] I am an internationally educated ICU nurse with 7 years of experience in a 32-bed tertiary ICU in Mumbai. My NNAS advisory report has been received by CNO and my NCLEX-RN is booked for August 15, 2026. I am comfortable on ventilators, CRRT, and post-cardiac surgery patients and eager to join a Toronto ICU team.",
      submitted_at: new Date(now - 4 * 86400000).toISOString(),
    });
  }

  return { ok: true };
});
