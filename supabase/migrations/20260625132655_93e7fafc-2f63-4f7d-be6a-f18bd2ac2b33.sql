
-- 1) Restrict self-assigned roles to non-privileged roles
DROP POLICY IF EXISTS "users insert own role" ON public.user_roles;
CREATE POLICY "users insert own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('professional'::public.app_role, 'employer'::public.app_role)
  );

-- 2) Make job_postings ownership check unambiguous
DROP POLICY IF EXISTS "employer manage own jobs" ON public.job_postings;
CREATE POLICY "employer manage own jobs"
  ON public.job_postings
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = employer_id
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.user_id = auth.uid()
        AND ep.user_id = job_postings.employer_id
    )
  )
  WITH CHECK (
    auth.uid() = employer_id
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.user_id = auth.uid()
        AND ep.user_id = job_postings.employer_id
    )
  );

-- 3) Revoke EXECUTE on internal SECURITY DEFINER trigger/helper functions from signed-in users
REVOKE EXECUTE ON FUNCTION public.on_new_message() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.sync_profile_view_count() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.sync_application_count() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.calc_profile_completeness(uuid) FROM PUBLIC, authenticated, anon;
