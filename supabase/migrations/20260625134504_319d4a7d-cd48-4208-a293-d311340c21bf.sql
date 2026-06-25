
-- 1) ai_search_results: remove conflicting permissive SELECT policy
DROP POLICY IF EXISTS "employer reads own ai search results" ON public.ai_search_results;

-- 2) profile_view_events: remove conflicting permissive INSERT policy
DROP POLICY IF EXISTS "authenticated can record profile views" ON public.profile_view_events;

-- 3) conversations: remove broader permissive INSERT policy, keep verified-employer-only
DROP POLICY IF EXISTS "verified participants insert conversation" ON public.conversations;

-- 4) professional_profiles: drop employer SELECT policy, replace with a view excluding raw work-auth fields
DROP POLICY IF EXISTS "employers can read searchable pros" ON public.professional_profiles;

CREATE OR REPLACE VIEW public.searchable_professional_profiles
WITH (security_invoker = false) AS
SELECT
  user_id, profession, profession_id, specialty, specialty_id,
  country_of_training, years_experience, languages,
  credentials_status, license_exam_status,
  work_authorized_without_sponsorship,
  currently_in_canada, current_city, preferred_cities,
  willing_to_relocate, desired_role_types, desired_employment_types,
  available_from, bio, completeness_score, profile_view_count,
  linkedin_url, portfolio_url, is_searchable, created_at, updated_at
FROM public.professional_profiles
WHERE is_searchable = true
  AND public.has_role(auth.uid(), 'employer'::public.app_role);

REVOKE ALL ON public.searchable_professional_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.searchable_professional_profiles TO authenticated;

-- 5) Revoke EXECUTE on privileged SECURITY DEFINER function not meant for direct client use
REVOKE EXECUTE ON FUNCTION public.calc_profile_completeness(uuid) FROM PUBLIC, anon, authenticated;
