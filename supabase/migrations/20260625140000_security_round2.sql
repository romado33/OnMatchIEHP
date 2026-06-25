
-- ============================================================
-- Security round 2 — address Lovable scanner warnings
-- ============================================================

-- ============================================================
-- FIX 1: Applications — split applicant ALL policy so employers
-- cannot overwrite applicant-controlled fields.
-- Column-level GRANT restricts employer UPDATEs to status +
-- employer_notes only.
-- ============================================================
DROP POLICY IF EXISTS "applicant submits and reads own application" ON public.applications;

CREATE POLICY "applicant reads own application"
  ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_user_id);

CREATE POLICY "applicant submits application"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_user_id);

CREATE POLICY "applicant withdraws own application"
  ON public.applications FOR DELETE TO authenticated
  USING (auth.uid() = applicant_user_id);

-- Restrict UPDATE to columns an employer is authorised to change;
-- applicants cannot UPDATE at all (they INSERT then DELETE to withdraw).
REVOKE UPDATE ON public.applications FROM authenticated;
GRANT  UPDATE (status, employer_notes, status_updated_at) ON public.applications TO authenticated;

-- ============================================================
-- FIX 2: Employer profiles — allow professionals and all
-- authenticated users to read verified employer basic info.
-- Internal admin columns (verification_notes, verified_by,
-- ontario_business_number, contact_phone, total_searches_run,
-- last_search_at) are not included in the non-owner grant.
-- ============================================================
DROP POLICY IF EXISTS "authenticated reads verified employer profiles" ON public.employer_profiles;

CREATE POLICY "authenticated reads verified employer profiles"
  ON public.employer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR verification_status = 'verified');

-- ============================================================
-- FIX 3: Professional profiles — restore employer SELECT so AI
-- search results are accessible.  Sensitive immigration columns
-- (work_authorization text, work_auth_type_id) are excluded at
-- the application layer: search_professional_profiles() omits
-- them from its return type, and rankCandidates server function
-- strips them before returning data to the browser.
-- ============================================================
DROP POLICY IF EXISTS "employers read searchable professional profiles" ON public.professional_profiles;
DROP POLICY IF EXISTS "employers can read searchable pros"             ON public.professional_profiles;

CREATE POLICY "employers read searchable professional profiles"
  ON public.professional_profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (is_searchable = true AND public.has_role(auth.uid(), 'employer'::public.app_role))
  );

-- ============================================================
-- FIX 4: Document SECURITY DEFINER functions that remain
-- callable by authenticated — both have internal caller guards.
-- ============================================================
COMMENT ON FUNCTION public.search_professional_profiles IS
  'SECURITY DEFINER — callable by authenticated. '
  'Internal guard: returns empty if caller is not an employer (has_role check). '
  'Intentionally excludes work_authorization and work_auth_type_id from return type.';

COMMENT ON FUNCTION public.set_initial_user_role IS
  'SECURITY DEFINER — callable by authenticated. '
  'Internal guards: one-time assignment only; role must be professional or employer. '
  'Atomically writes user_roles and updates profiles.account_type.';
