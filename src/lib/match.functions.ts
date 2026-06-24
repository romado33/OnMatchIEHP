import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  query: z.string().min(10),
  // Optional pre-filters applied in SQL before the AI ranking call
  profession_id: z.string().optional(),
  region_ids: z.array(z.string()).optional(),
  work_authorized_only: z.boolean().optional(),
  min_years_experience: z.number().min(0).max(60).optional(),
});

// The candidate shape sent to the AI — work_authorization is intentionally excluded.
// Employers receive only the privacy-safe boolean (work_authorized_without_sponsorship).
type Candidate = {
  user_id: string;
  profession: string;
  specialty: string | null;
  country_of_training: string;
  years_experience: number;
  languages: string[];
  credentials_status: string | null;
  license_exam_status: string | null;
  work_authorized_without_sponsorship: boolean | null;
  currently_in_canada: boolean;
  current_city: string | null;
  preferred_cities: string[];
  willing_to_relocate: boolean;
  desired_role_types: string[];
  desired_employment_types: string[];
  available_from: string | null;
  bio: string | null;
};

export const matchCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    // Confirm caller is an employer with a verified account.
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isEmployer = (roles ?? []).some((r: { role: string }) => r.role === "employer");
    if (!isEmployer) {
      return {
        error: "Only employer accounts can run candidate searches.",
        matches: [] as Array<{ candidate: Candidate; score: number; rationale: string }>,
      };
    }

    // Verify the employer account before allowing searches.
    const { data: empProfile } = await context.supabase
      .from("employer_profiles")
      .select("verification_status")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!empProfile || empProfile.verification_status !== "verified") {
      return {
        error: "Your employer account must be verified before running candidate searches.",
        matches: [],
      };
    }

    // Build the query with optional pre-filters.
    // NOTE: work_authorization is deliberately excluded from the SELECT to prevent
    // raw immigration status from being sent to the AI or returned to the frontend.
    let query = context.supabase
      .from("professional_profiles")
      .select(
        `user_id, profession, specialty, country_of_training, years_experience,
         languages, credentials_status, license_exam_status,
         work_authorized_without_sponsorship,
         currently_in_canada, current_city, preferred_cities,
         willing_to_relocate, desired_role_types, desired_employment_types,
         available_from, bio`,
      )
      .eq("is_searchable", true);

    if (data.profession_id) {
      query = query.eq("profession_id", data.profession_id);
    }
    if (data.work_authorized_only) {
      query = query.eq("work_authorized_without_sponsorship", true);
    }
    if (data.min_years_experience !== undefined) {
      query = query.gte("years_experience", data.min_years_experience);
    }

    const { data: pool, error } = await query.limit(80);
    if (error) return { error: error.message, matches: [] };

    const candidates = (pool ?? []) as Candidate[];
    if (candidates.length === 0) return { error: null, matches: [] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI gateway not configured.", matches: [] };

    // Log the search session (best-effort; do not block on failure).
    context.supabase
      .from("ai_search_sessions")
      .insert({
        employer_user_id: context.userId,
        query_text: data.query,
        candidate_pool_size: candidates.length,
        model_used: "google/gemini-2.5-flash",
      })
      .then(() => {});

    const sys = `You are a healthcare recruiting analyst for Ontario, Canada. Rank candidates against a role description.
Return ONLY strict JSON: {"matches":[{"user_id":string,"score":number (0-100),"rationale":string}]}
Include the top 10 best matches in descending score order. Score reflects overall fit.
Rationale is one concise sentence citing the most relevant professional facts.
Do NOT reference country of origin, ethnicity, or immigration status in your rationale.`;

    const userMsg = `ROLE DESCRIPTION:\n${data.query}\n\nCANDIDATES (JSON):\n${JSON.stringify(candidates)}`;

    const start = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      return { error: "Matching service unavailable. Try again shortly.", matches: [] };
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    // Update session with token usage and latency (best-effort).
    context.supabase
      .from("ai_search_sessions")
      .update({
        results_returned: payload.choices?.length ?? 0,
        tokens_prompt: payload.usage?.prompt_tokens,
        tokens_completion: payload.usage?.completion_tokens,
        latency_ms: latencyMs,
      })
      .eq("employer_user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(() => {});

    const content = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: { matches?: Array<{ user_id: string; score: number; rationale: string }> } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const ranked = (parsed.matches ?? [])
      .map((m) => {
        const candidate = candidates.find((c) => c.user_id === m.user_id);
        return candidate ? { candidate, score: m.score, rationale: m.rationale } : null;
      })
      .filter(Boolean) as Array<{ candidate: Candidate; score: number; rationale: string }>;

    return { error: null, matches: ranked };
  });
