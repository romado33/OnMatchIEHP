
-- 1) Tighten cross-user RPCs with caller ownership checks
CREATE OR REPLACE FUNCTION public.employer_daily_search_count(_employer_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN auth.uid() = _employer_user_id THEN
    (SELECT COUNT(*)::INT FROM public.ai_search_sessions
     WHERE employer_user_id = _employer_user_id
       AND created_at > now() - INTERVAL '24 hours')
  ELSE 0 END
$$;

CREATE OR REPLACE FUNCTION public.user_has_required_consents(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN auth.uid() = _user_id THEN (
    EXISTS (SELECT 1 FROM public.consent_records cr JOIN public.platform_settings ps ON ps.key = 'current_tos_version' WHERE cr.user_id = _user_id AND cr.consent_type = 'terms_of_service' AND cr.consented = true AND cr.version = ps.value #>> '{}')
    AND EXISTS (SELECT 1 FROM public.consent_records cr JOIN public.platform_settings ps ON ps.key = 'current_privacy_version' WHERE cr.user_id = _user_id AND cr.consent_type = 'privacy_policy' AND cr.consented = true AND cr.version = ps.value #>> '{}')
    AND EXISTS (SELECT 1 FROM public.consent_records WHERE user_id = _user_id AND consent_type = 'ai_processing' AND consented = true)
  ) ELSE false END
$$;

-- 2) Revoke EXECUTE from anon/public on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.employer_daily_search_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_required_consents(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.employer_daily_search_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_required_consents(uuid) TO authenticated;

-- 3) Conversations: enforce role-based participants and split policies
DROP POLICY IF EXISTS "conversation participants read and update" ON public.conversations;

CREATE POLICY "conversation participants read"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = professional_user_id);

CREATE POLICY "conversation participants update"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = employer_user_id OR auth.uid() = professional_user_id);

CREATE POLICY "verified participants insert conversation"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = employer_user_id OR auth.uid() = professional_user_id)
    AND auth.uid() = initiated_by
    AND public.has_role(employer_user_id, 'employer'::public.app_role)
    AND public.has_role(professional_user_id, 'professional'::public.app_role)
  );

-- 4) AI search results: owning employer can read their session results
CREATE POLICY "employer reads own ai search results"
  ON public.ai_search_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_search_sessions s
      WHERE s.id = ai_search_results.session_id
        AND s.employer_user_id = auth.uid()
    )
  );

-- 5) Profile view events: allow any authenticated viewer to log a view
CREATE POLICY "authenticated can record profile views"
  ON public.profile_view_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
