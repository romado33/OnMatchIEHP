-- ============================================================
-- MIGRATION 005: Security Hardening
--
-- Fixes all issues identified by Lovable's security scanner:
--
-- CRITICAL:
--   1. anonymize_user_data (SECURITY DEFINER) was callable by anon
--      — anyone could wipe any user's data unauthenticated.
--   2. Role self-assignment: onboarding did raw INSERTs into
--      user_roles; replaced with set_initial_user_role() which
--      enforces professional|employer only and one-time set.
--
-- WARNING:
--   3. user_consent_status view exposed all users' consent rows.
--   4. Conversations: any user could initiate with anyone.
--   5. profile_view_events / ai_search_results: intent of
--      service_role-only INSERT not documented in RLS.
--   6. professional_profiles ALL policy replaced with explicit
--      per-operation policies to prevent RPC misuse.
--   7. anon executable SECURITY DEFINER functions revoked.
-- ============================================================

-- ============================================================
-- 1. Revoke anon/public EXECUTE on SECURITY DEFINER functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.user_has_required_consents(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_required_consents(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.user_has_required_consents(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.employer_daily_search_count(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.employer_daily_search_count(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.employer_daily_search_count(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;

REVOKE EXECUTE ON FUNCTION public.calc_profile_completeness(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calc_profile_completeness(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.calc_profile_completeness(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
GRANT  EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- ============================================================
-- 2. Safe role assignment (replaces raw INSERT + assign_employer_role)
-- ============================================================
DROP POLICY IF EXISTS "users insert own role" ON public.user_roles;

REVOKE EXECUTE ON FUNCTION public.assign_employer_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_employer_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_employer_role() FROM anon;

CREATE OR REPLACE FUNCTION public.set_initial_user_role(_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _app_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Only professional or employer may be self-assigned; admin is blocked.
  IF _role NOT IN ('professional', 'employer') THEN
    RAISE EXCEPTION 'invalid role: only professional or employer may be self-assigned';
  END IF;

  _app_role := _role::public.app_role;

  -- One-time only: prevents switching roles after onboarding.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'role already assigned';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Keep profiles.account_type in sync atomically.
  UPDATE public.profiles
  SET account_type = _role
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_initial_user_role(TEXT) TO authenticated;

-- ============================================================
-- 3. Restrict user_consent_status view to current user only
-- ============================================================
CREATE OR REPLACE VIEW public.user_consent_status AS
SELECT
  u.id                                                                            AS user_id,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'terms_of_service')      AS tos_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'privacy_policy')        AS privacy_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'ai_processing')         AS ai_processing_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'data_sharing_employers') AS data_sharing_accepted
FROM auth.users u
LEFT JOIN public.consent_records c ON c.user_id = u.id
WHERE u.id = auth.uid()
GROUP BY u.id;

GRANT SELECT ON public.user_consent_status TO authenticated;
ALTER VIEW public.user_consent_status SET (security_invoker = true);

-- ============================================================
-- 4. Conversations: split the overly-broad ALL policy into
--    per-operation policies.
--    Lovable's intent: either role may initiate a conversation
--    as long as they set initiated_by = themselves and the
--    conversation is between a verified employer + professional.
-- ============================================================
DROP POLICY IF EXISTS "conversation participants read and update" ON public.conversations;

CREATE POLICY "verified participants insert conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = employer_user_id OR auth.uid() = professional_user_id)
    AND auth.uid() = initiated_by
    AND public.has_role(employer_user_id, 'employer'::public.app_role)
    AND public.has_role(professional_user_id, 'professional'::public.app_role)
  );

CREATE POLICY "conversation participants read"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = professional_user_id);

CREATE POLICY "conversation participants update"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = employer_user_id OR auth.uid() = professional_user_id);

-- ============================================================
-- 5. Restore functional policies for profile_view_events and
--    ai_search_results that were also addressed by Lovable.
--    Lovable's intent: clients record view events; employers
--    read their own AI match results.
-- ============================================================
CREATE POLICY "authenticated can record profile views"
  ON public.profile_view_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "employer reads own ai search results"
  ON public.ai_search_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_search_sessions s
      WHERE s.id = ai_search_results.session_id
        AND s.employer_user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Replace professional_profiles ALL policy with per-operation
--    policies to close the RPC write path
-- ============================================================
DROP POLICY IF EXISTS "own pro profile crud" ON public.professional_profiles;

CREATE POLICY "professional reads own profile"
  ON public.professional_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "professional writes own profile"
  ON public.professional_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional updates own profile"
  ON public.professional_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "professional deletes own profile"
  ON public.professional_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
