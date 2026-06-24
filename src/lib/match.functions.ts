import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ query: z.string().min(10) });

type Candidate = {
  user_id: string;
  profession: string;
  specialty: string | null;
  country_of_training: string;
  years_experience: number;
  languages: string[];
  credentials_status: string | null;
  license_exam_status: string | null;
  work_authorization: string | null;
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
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    // Confirm caller is an employer.
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isEmployer = (roles ?? []).some((r: { role: string }) => r.role === "employer");
    if (!isEmployer) {
      return { error: "Only employer accounts can run candidate searches.", matches: [] as Array<{ candidate: Candidate; score: number; rationale: string }> };
    }

    const { data: pool, error } = await context.supabase
      .from("professional_profiles")
      .select("user_id, profession, specialty, country_of_training, years_experience, languages, credentials_status, license_exam_status, work_authorization, currently_in_canada, current_city, preferred_cities, willing_to_relocate, desired_role_types, desired_employment_types, available_from, bio")
      .eq("is_searchable", true)
      .limit(100);
    if (error) return { error: error.message, matches: [] };

    const candidates = (pool ?? []) as Candidate[];
    if (candidates.length === 0) return { error: null, matches: [] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI gateway not configured.", matches: [] };

    const sys = `You are a healthcare recruiting analyst for Ontario, Canada. Rank candidates against a role description.
Return ONLY strict JSON in the shape: {"matches":[{"user_id":string,"score":number (0-100),"rationale":string}]}. Include the top 10 best matches in descending score. Score reflects fit. Rationale is one short sentence citing the most relevant facts.`;

    const userMsg = `ROLE DESCRIPTION:\n${data.query}\n\nCANDIDATES (JSON):\n${JSON.stringify(candidates)}`;

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

    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      return { error: "Matching service unavailable. Try again shortly.", matches: [] };
    }
    const payload = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: { matches?: Array<{ user_id: string; score: number; rationale: string }> } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const ranked = (parsed.matches ?? []).map((m) => {
      const candidate = candidates.find((c) => c.user_id === m.user_id);
      return candidate ? { candidate, score: m.score, rationale: m.rationale } : null;
    }).filter(Boolean) as Array<{ candidate: Candidate; score: number; rationale: string }>;

    return { error: null, matches: ranked };
  });