
-- 1) Revoke EXECUTE on SECURITY DEFINER functions not called directly from client
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.employer_daily_search_count(uuid) FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_required_consents(uuid) FROM authenticated, PUBLIC;

-- 2) job_postings: hide moderation metadata columns from authenticated reads
REVOKE SELECT ON public.job_postings FROM authenticated;
GRANT SELECT (
  id, employer_id, title, profession, specialty, city, employment_type,
  description, requirements, is_active, created_at, updated_at,
  profession_id, specialty_id, region_id, org_type_id,
  salary_min, salary_max, salary_period, open_to_sponsorship,
  requires_current_registration, start_date, application_deadline,
  positions_available, remote_possible, benefits, view_count, application_count
) ON public.job_postings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;

-- 3) profile_view_events: tighten insert policy — only employers viewing searchable pros
DROP POLICY IF EXISTS "authenticated can record profile views" ON public.profile_view_events;
CREATE POLICY "employers record profile views on searchable profiles"
  ON public.profile_view_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'employer'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.professional_profiles p
      WHERE p.user_id = profile_view_events.professional_user_id
        AND p.is_searchable = true
    )
  );

-- 4) professional_profiles: confirm employer-facing reads go through the RPC only.
--    No direct SELECT policy is added on purpose: the search_professional_profiles
--    SECURITY DEFINER function is the sanctioned employer read path and it
--    deliberately excludes sensitive work-authorization columns.
COMMENT ON TABLE public.professional_profiles IS
  'Direct employer SELECT is intentionally blocked by RLS. Employers must read profiles via public.search_professional_profiles(), which omits work_authorization and work_auth_type_id.';
