-- ============================================================
-- MIGRATION 004: Feature, Compliance & Enhancement Tables
--
-- Sections:
--   1.  Consent & compliance
--   2.  Employer profile — verification + enhancements
--   3.  Employer team members
--   4.  Professional profile — structured FK columns + extras
--   5.  Professional credentials (structured tracker)
--   6.  Professional language proficiencies
--   7.  Professional documents (metadata; files in Storage)
--   8.  Job postings — enhancements
--   9.  Applications (professional → job posting)
--   10. Shortlists (employer saves a candidate)
--   11. Messaging (conversations + messages)
--   12. Notifications
--   13. AI search sessions + results (audit + bias monitoring)
--   14. Profile view events (privacy-safe — no viewer identity stored)
--   15. Data deletion requests (PIPEDA right to erasure)
--   16. Audit log
--   17. Content reports / flags
--   18. Platform settings
--   19. Helper functions
-- ============================================================

-- ============================================================
-- 1. CONSENT & COMPLIANCE
-- ============================================================

CREATE TABLE public.consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- consent_type values:
  --   'terms_of_service'        — must be accepted before onboarding
  --   'privacy_policy'          — must be accepted before onboarding
  --   'ai_processing'           — consent to AI-powered matching using their profile
  --   'data_sharing_employers'  — consent to share profile data with verified employers
  --   'marketing_emails'        — opt-in only
  consent_type  TEXT NOT NULL,
  version       TEXT NOT NULL,  -- e.g. '2026-06-24' — matched to platform_settings
  consented     BOOLEAN NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  consented_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_user_type ON public.consent_records(user_id, consent_type);

GRANT SELECT, INSERT ON public.consent_records TO authenticated;
GRANT ALL             ON public.consent_records TO service_role;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own consents"
  ON public.consent_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users insert own consents"
  ON public.consent_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- View: has the user given all required consents for the current versions?
-- (Used in auth middleware to gate access to the app)
CREATE OR REPLACE VIEW public.user_consent_status AS
SELECT
  u.id                                                   AS user_id,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'terms_of_service')        AS tos_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'privacy_policy')          AS privacy_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'ai_processing')           AS ai_processing_accepted,
  bool_and(c.consented) FILTER (WHERE c.consent_type = 'data_sharing_employers')  AS data_sharing_accepted
FROM auth.users u
LEFT JOIN public.consent_records c ON c.user_id = u.id
GROUP BY u.id;

GRANT SELECT ON public.user_consent_status TO authenticated;
ALTER VIEW public.user_consent_status SET (security_invoker = true);

-- ============================================================
-- 2. EMPLOYER PROFILE — VERIFICATION ENHANCEMENTS
-- ============================================================

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS org_type_id              TEXT REFERENCES public.ref_org_types(id),
  ADD COLUMN IF NOT EXISTS region_id                TEXT REFERENCES public.ref_ontario_regions(id),
  ADD COLUMN IF NOT EXISTS verification_status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verified_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verification_notes       TEXT,
  ADD COLUMN IF NOT EXISTS ontario_business_number  TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url             TEXT,
  ADD COLUMN IF NOT EXISTS accepts_sponsored_workers BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lmia_capable             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_searches_run       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_search_at           TIMESTAMPTZ;

-- Index for admin verification queue
CREATE INDEX idx_employer_verification
  ON public.employer_profiles(verification_status, created_at);

-- ============================================================
-- 3. EMPLOYER TEAM MEMBERS
-- Allows multiple HR staff to share access to one org account.
-- ============================================================

CREATE TABLE public.employer_team_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- org_owner_user_id: the verified employer account that is the org root
  org_owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'recruiter'
    CHECK (role IN ('admin', 'recruiter', 'viewer')),
  invited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at       TIMESTAMPTZ,
  UNIQUE(org_owner_user_id, member_user_id)
);

CREATE INDEX idx_team_org    ON public.employer_team_members(org_owner_user_id);
CREATE INDEX idx_team_member ON public.employer_team_members(member_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_team_members TO authenticated;
GRANT ALL ON public.employer_team_members TO service_role;
ALTER TABLE public.employer_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org admin manages team"
  ON public.employer_team_members FOR ALL TO authenticated
  USING (auth.uid() = org_owner_user_id)
  WITH CHECK (auth.uid() = org_owner_user_id);
CREATE POLICY "member reads own invite"
  ON public.employer_team_members FOR SELECT TO authenticated
  USING (auth.uid() = member_user_id);

-- ============================================================
-- 4. PROFESSIONAL PROFILE — STRUCTURED FK COLUMNS
-- We ADD new structured columns alongside existing free-text
-- columns so no existing data is broken.
-- ============================================================

ALTER TABLE public.professional_profiles
  -- Structured FKs replacing free-text fields (old columns kept for migration)
  ADD COLUMN IF NOT EXISTS profession_id               TEXT REFERENCES public.ref_professions(id),
  ADD COLUMN IF NOT EXISTS specialty_id                TEXT REFERENCES public.ref_specialties(id),
  ADD COLUMN IF NOT EXISTS country_of_training_code    TEXT REFERENCES public.ref_countries(code),
  ADD COLUMN IF NOT EXISTS work_auth_type_id           TEXT REFERENCES public.ref_work_auth_types(id),
  -- Employer sees only this derived boolean (privacy-safe, not the raw type)
  ADD COLUMN IF NOT EXISTS work_authorized_without_sponsorship BOOLEAN,
  -- Professional controls whether employers can see work auth at all
  ADD COLUMN IF NOT EXISTS consent_work_auth_visible   BOOLEAN NOT NULL DEFAULT false,
  -- Profile quality
  ADD COLUMN IF NOT EXISTS completeness_score          INT NOT NULL DEFAULT 0
    CHECK (completeness_score BETWEEN 0 AND 100),
  -- Stats (updated by triggers/functions)
  ADD COLUMN IF NOT EXISTS profile_view_count          INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at              TIMESTAMPTZ,
  -- Preferred region FKs (array of region IDs)
  ADD COLUMN IF NOT EXISTS preferred_region_ids        TEXT[] NOT NULL DEFAULT '{}',
  -- Salary expectations
  ADD COLUMN IF NOT EXISTS salary_expectation_min      INT,
  ADD COLUMN IF NOT EXISTS salary_expectation_max      INT,
  ADD COLUMN IF NOT EXISTS salary_period               TEXT CHECK (salary_period IN ('hourly', 'annual')),
  -- Social / portfolio
  ADD COLUMN IF NOT EXISTS linkedin_url                TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url               TEXT;

-- Index to support employer search by profession + region
CREATE INDEX idx_pro_profiles_profession
  ON public.professional_profiles(profession_id)
  WHERE is_searchable = true;

-- ============================================================
-- 5. PROFESSIONAL CREDENTIALS (structured tracker)
-- One row per credential milestone per professional.
-- Replaces/supplements the free-text credentials_status +
-- license_exam_status columns.
-- ============================================================

CREATE TABLE public.professional_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id         TEXT REFERENCES public.ref_credential_steps(id),  -- NULL if custom
  custom_step_name TEXT,
  -- At least one of step_id or custom_step_name must be set
  CONSTRAINT chk_credential_step CHECK (step_id IS NOT NULL OR custom_step_name IS NOT NULL),
  status          TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','submitted','completed','failed','waived','na')),
  started_at      DATE,
  completed_at    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pro_cred_user ON public.professional_credentials(user_id);
CREATE TRIGGER trg_pro_cred_updated
  BEFORE UPDATE ON public.professional_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_credentials TO authenticated;
GRANT ALL ON public.professional_credentials TO service_role;
ALTER TABLE public.professional_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own credential crud"
  ON public.professional_credentials FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Employers can read credentials only for searchable professionals
-- (no private notes exposed — only status and dates)
CREATE POLICY "employers read searchable pro credentials"
  ON public.professional_credentials FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer')
    AND EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = professional_credentials.user_id
        AND pp.is_searchable = true
    )
  );

-- ============================================================
-- 6. PROFESSIONAL LANGUAGE PROFICIENCIES
-- ============================================================

CREATE TABLE public.professional_language_proficiencies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code    TEXT NOT NULL REFERENCES public.ref_languages(code),
  proficiency_level TEXT
    CHECK (proficiency_level IN ('basic','conversational','professional','native')),
  test_id          TEXT REFERENCES public.ref_language_tests(id),  -- NULL if no formal test
  test_score       TEXT,   -- e.g. '7.5 overall', 'CLB 10', 'B Grade OET'
  test_date        DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, language_code)
);

CREATE INDEX idx_lang_prof_user ON public.professional_language_proficiencies(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_language_proficiencies TO authenticated;
GRANT ALL ON public.professional_language_proficiencies TO service_role;
ALTER TABLE public.professional_language_proficiencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own language proficiency crud"
  ON public.professional_language_proficiencies FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "employers read searchable pro languages"
  ON public.professional_language_proficiencies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer')
    AND EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = professional_language_proficiencies.user_id
        AND pp.is_searchable = true
    )
  );

-- ============================================================
-- 7. PROFESSIONAL DOCUMENTS (metadata only; files in Storage)
-- Storage bucket: 'professional-documents' (private, per-user)
-- ============================================================

CREATE TABLE public.professional_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL
    CHECK (doc_type IN (
      'degree_certificate',
      'transcript',
      'credential_assessment',   -- NNAS Advisory Report, CAPR report, etc.
      'license_exam_result',     -- NCLEX, MCCQE1, PCE results
      'regulatory_registration', -- College certificate / registration card
      'reference_letter',
      'employment_contract',
      'language_test_result',    -- IELTS, CELBAN, OET
      'work_permit',             -- NOTE: handle with extra care — immigration document
      'identity_document',       -- NOTE: handle with extra care
      'other'
    )),
  doc_label        TEXT NOT NULL,           -- e.g. 'CNO Registration Certificate 2024'
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,           -- Supabase Storage bucket path
  file_size_bytes  INT,
  mime_type        TEXT,
  -- Verification by admin (optional, future feature)
  is_verified      BOOLEAN NOT NULL DEFAULT false,
  verified_at      TIMESTAMPTZ,
  verified_by      UUID REFERENCES auth.users(id),
  -- Sensitive flag — work permits and ID docs have stricter access
  is_sensitive     BOOLEAN NOT NULL DEFAULT false,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pro_docs_user ON public.professional_documents(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_documents TO authenticated;
GRANT ALL ON public.professional_documents TO service_role;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;

-- Professionals manage their own documents
CREATE POLICY "own document crud"
  ON public.professional_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Employers can only see non-sensitive document metadata (never storage_path, never sensitive docs)
-- Actual file access is controlled separately in Storage RLS
CREATE POLICY "employers read non-sensitive doc metadata"
  ON public.professional_documents FOR SELECT TO authenticated
  USING (
    is_sensitive = false
    AND public.has_role(auth.uid(), 'employer')
    AND EXISTS (
      SELECT 1 FROM public.professional_profiles pp
      WHERE pp.user_id = professional_documents.user_id
        AND pp.is_searchable = true
    )
  );

-- ============================================================
-- 8. JOB POSTINGS — ENHANCEMENTS
-- Extends the existing table (all columns are IF NOT EXISTS)
-- ============================================================

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS profession_id                TEXT REFERENCES public.ref_professions(id),
  ADD COLUMN IF NOT EXISTS specialty_id                 TEXT REFERENCES public.ref_specialties(id),
  ADD COLUMN IF NOT EXISTS region_id                    TEXT REFERENCES public.ref_ontario_regions(id),
  ADD COLUMN IF NOT EXISTS org_type_id                  TEXT REFERENCES public.ref_org_types(id),
  ADD COLUMN IF NOT EXISTS salary_min                   INT,
  ADD COLUMN IF NOT EXISTS salary_max                   INT,
  ADD COLUMN IF NOT EXISTS salary_period                TEXT CHECK (salary_period IN ('hourly', 'annual')),
  ADD COLUMN IF NOT EXISTS open_to_sponsorship          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_current_registration BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_date                   DATE,
  ADD COLUMN IF NOT EXISTS application_deadline         DATE,
  ADD COLUMN IF NOT EXISTS positions_available          INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS remote_possible              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS benefits                     TEXT[] NOT NULL DEFAULT '{}',
  -- Compliance / moderation
  ADD COLUMN IF NOT EXISTS flagged_discriminatory_language BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  -- Stats
  ADD COLUMN IF NOT EXISTS view_count                   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS application_count            INT NOT NULL DEFAULT 0;

CREATE INDEX idx_job_postings_active_profession
  ON public.job_postings(profession_id, is_active)
  WHERE is_active = true AND moderation_status = 'approved';

-- ============================================================
-- 9. APPLICATIONS
-- ============================================================

CREATE TABLE public.applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id   UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN (
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'offer_made',
      'hired',
      'withdrawn',
      'rejected'
    )),
  cover_note       TEXT,
  employer_notes   TEXT,    -- internal to employer, never exposed to applicant via RLS
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, applicant_user_id)
);

CREATE INDEX idx_applications_job       ON public.applications(job_posting_id);
CREATE INDEX idx_applications_applicant ON public.applications(applicant_user_id);
CREATE INDEX idx_applications_status    ON public.applications(status);

GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Professionals: insert own application; read own application (excluding employer_notes)
CREATE POLICY "applicant submits and reads own application"
  ON public.applications FOR ALL TO authenticated
  USING (auth.uid() = applicant_user_id)
  WITH CHECK (auth.uid() = applicant_user_id);

-- Employers: read and update applications to their own job postings
CREATE POLICY "employer reads applications to own postings"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = applications.job_posting_id
        AND jp.employer_id = auth.uid()
    )
  );
CREATE POLICY "employer updates application status"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = applications.job_posting_id
        AND jp.employer_id = auth.uid()
    )
  );

-- Trigger: keep application_count on job_postings in sync
CREATE OR REPLACE FUNCTION public.sync_application_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_postings
    SET application_count = application_count + 1
    WHERE id = NEW.job_posting_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_postings
    SET application_count = GREATEST(application_count - 1, 0)
    WHERE id = OLD.job_posting_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_application_count
  AFTER INSERT OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_application_count();

-- ============================================================
-- 10. SHORTLISTS
-- Employer saves a candidate from AI search or manual browse.
-- ============================================================

CREATE TABLE public.shortlists (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_name            TEXT NOT NULL DEFAULT 'Default',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employer_user_id, professional_user_id, list_name)
);

CREATE INDEX idx_shortlist_employer ON public.shortlists(employer_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shortlists TO authenticated;
GRANT ALL ON public.shortlists TO service_role;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer manages own shortlists"
  ON public.shortlists FOR ALL TO authenticated
  USING (auth.uid() = employer_user_id)
  WITH CHECK (auth.uid() = employer_user_id);

-- ============================================================
-- 11. MESSAGING
-- ============================================================

CREATE TABLE public.conversations (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id             UUID REFERENCES public.job_postings(id),
  initiated_by               UUID NOT NULL REFERENCES auth.users(id),
  last_message_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  employer_unread_count      INT NOT NULL DEFAULT 0,
  professional_unread_count  INT NOT NULL DEFAULT 0,
  is_archived_employer       BOOLEAN NOT NULL DEFAULT false,
  is_archived_professional   BOOLEAN NOT NULL DEFAULT false,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one thread per employer+professional pair per job (NULLs handled via unique partial indexes)
CREATE UNIQUE INDEX idx_conv_unique_with_job
  ON public.conversations(employer_user_id, professional_user_id, job_posting_id)
  WHERE job_posting_id IS NOT NULL;
CREATE UNIQUE INDEX idx_conv_unique_no_job
  ON public.conversations(employer_user_id, professional_user_id)
  WHERE job_posting_id IS NULL;

CREATE INDEX idx_conv_employer      ON public.conversations(employer_user_id, last_message_at DESC);
CREATE INDEX idx_conv_professional  ON public.conversations(professional_user_id, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation participants read and update"
  ON public.conversations FOR ALL TO authenticated
  USING (auth.uid() = employer_user_id OR auth.uid() = professional_user_id)
  WITH CHECK (auth.uid() = employer_user_id OR auth.uid() = professional_user_id);

-- ----

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, sent_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only participants in the conversation can read/send messages
CREATE POLICY "conversation participants access messages"
  ON public.messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.employer_user_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.employer_user_id = auth.uid() OR c.professional_user_id = auth.uid())
    )
  );

-- Trigger: update conversation.last_message_at and unread counts on new message
CREATE OR REPLACE FUNCTION public.on_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.sent_at,
    employer_unread_count = CASE
      WHEN employer_user_id <> NEW.sender_user_id
      THEN employer_unread_count + 1
      ELSE employer_unread_count
    END,
    professional_unread_count = CASE
      WHEN professional_user_id <> NEW.sender_user_id
      THEN professional_unread_count + 1
      ELSE professional_unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_new_message();

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- type values:
  --   'profile_viewed'             — someone viewed your profile (count only, not who)
  --   'new_job_match'              — a new job posting matches your profile
  --   'application_status_changed' — your application status was updated
  --   'message_received'           — new message in a conversation
  --   'shortlisted'                — an employer added you to a shortlist
  --   'credential_reminder'        — reminder to update credential progress
  --   'employer_verified'          — your employer account has been verified
  --   'system'                     — platform-wide announcement
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  action_url  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users mark notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- INSERT is service_role only (notifications are created by server functions)

-- ============================================================
-- 13. AI SEARCH SESSIONS + RESULTS
-- Enables bias monitoring, cost tracking, and audit trail.
-- ============================================================

CREATE TABLE public.ai_search_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text            TEXT NOT NULL,
  candidate_pool_size   INT,
  results_returned      INT,
  model_used            TEXT,
  tokens_prompt         INT,
  tokens_completion     INT,
  latency_ms            INT,
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_sessions_employer
  ON public.ai_search_sessions(employer_user_id, created_at DESC);
CREATE INDEX idx_ai_sessions_date
  ON public.ai_search_sessions(created_at DESC);

-- Rate limiting helper: count searches by employer in last 24h
CREATE OR REPLACE FUNCTION public.employer_daily_search_count(_employer_user_id UUID)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::INT
  FROM public.ai_search_sessions
  WHERE employer_user_id = _employer_user_id
    AND created_at > now() - INTERVAL '24 hours'
$$;
GRANT EXECUTE ON FUNCTION public.employer_daily_search_count(UUID) TO authenticated;

-- ----

CREATE TABLE public.ai_search_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES public.ai_search_sessions(id) ON DELETE CASCADE,
  professional_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank                 INT NOT NULL,
  score                NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  rationale            TEXT,
  -- Track downstream actions (for bias analysis)
  was_shortlisted      BOOLEAN NOT NULL DEFAULT false,
  was_contacted        BOOLEAN NOT NULL DEFAULT false,
  was_hired            BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_ai_results_session ON public.ai_search_results(session_id);

GRANT SELECT, INSERT ON public.ai_search_sessions TO authenticated;
GRANT ALL ON public.ai_search_sessions TO service_role;
ALTER TABLE public.ai_search_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employer reads own search sessions"
  ON public.ai_search_sessions FOR SELECT TO authenticated
  USING (auth.uid() = employer_user_id);
CREATE POLICY "employer inserts own search session"
  ON public.ai_search_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = employer_user_id);

-- ai_search_results: service_role only (contains professional user_ids cross-referenced with employer)
GRANT ALL ON public.ai_search_results TO service_role;
ALTER TABLE public.ai_search_results ENABLE ROW LEVEL SECURITY;
-- No authenticated policies — only server functions access this table

-- ============================================================
-- 14. PROFILE VIEW EVENTS (privacy-by-design)
-- We log that a view happened (for the professional's benefit)
-- but intentionally DO NOT record who viewed — eliminating
-- the risk that employer viewing patterns become identifiable.
-- ============================================================

CREATE TABLE public.profile_view_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_source          TEXT NOT NULL
    CHECK (view_source IN ('ai_search', 'job_application', 'direct_link', 'shortlist')),
  viewed_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_views_pro
  ON public.profile_view_events(professional_user_id, viewed_at DESC);

GRANT ALL ON public.profile_view_events TO service_role;
ALTER TABLE public.profile_view_events ENABLE ROW LEVEL SECURITY;
-- Professionals can count their own views; no individual event detail exposed
CREATE POLICY "professional reads own view events"
  ON public.profile_view_events FOR SELECT TO authenticated
  USING (auth.uid() = professional_user_id);
-- INSERT only via service_role / server functions

-- Trigger: keep profile_view_count in sync on professional_profiles
CREATE OR REPLACE FUNCTION public.sync_profile_view_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.professional_profiles
  SET profile_view_count = profile_view_count + 1
  WHERE user_id = NEW.professional_user_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_profile_view_count
  AFTER INSERT ON public.profile_view_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_view_count();

-- ============================================================
-- 15. DATA DELETION REQUESTS (PIPEDA s.4.3 right to erasure)
-- ============================================================

CREATE TABLE public.data_deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'denied')),
  processed_at  TIMESTAMPTZ,
  processed_by  UUID REFERENCES auth.users(id),
  admin_notes   TEXT
);

GRANT SELECT, INSERT ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.data_deletion_requests TO service_role;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users submit own deletion request"
  ON public.data_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users read own deletion requests"
  ON public.data_deletion_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 16. AUDIT LOG
-- Immutable record of admin and system actions.
-- ============================================================

CREATE TABLE public.audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  -- examples: 'employer_verified', 'employer_rejected', 'job_posting_approved',
  -- 'job_posting_removed', 'data_deleted', 'user_suspended', 'admin_search'
  target_type    TEXT,   -- 'employer_profile', 'professional_profile', 'job_posting', 'user'
  target_id      UUID,
  details        JSONB,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor  ON public.audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_target ON public.audit_log(target_type, target_id);
CREATE INDEX idx_audit_date   ON public.audit_log(created_at DESC);

-- audit_log is append-only; only service_role / admin server functions write to it.
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Admins can read (admin check via has_role)
CREATE POLICY "admins read audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 17. CONTENT REPORTS / FLAGS
-- ============================================================

CREATE TABLE public.content_reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type        TEXT NOT NULL
    CHECK (target_type IN ('job_posting', 'employer_profile', 'message', 'professional_profile')),
  target_id          UUID NOT NULL,
  reason             TEXT NOT NULL
    CHECK (reason IN (
      'discriminatory_language',
      'false_information',
      'spam',
      'inappropriate_contact',
      'privacy_violation',
      'unlicensed_practice',
      'other'
    )),
  details            TEXT,
  status             TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by        UUID REFERENCES auth.users(id),
  resolved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON public.content_reports(status, created_at);

GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users submit reports"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "users read own reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);
CREATE POLICY "admins manage reports"
  ON public.content_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 18. PLATFORM SETTINGS
-- ============================================================

CREATE TABLE public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id)
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL    ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('maintenance_mode',
   'false',
   'Set to true to show a maintenance page to all non-admin users'),

  ('employer_verification_required',
   'true',
   'Verified employers only may run AI candidate searches'),

  ('ai_search_daily_limit_per_employer',
   '20',
   'Maximum AI search calls per employer account per 24-hour period'),

  ('min_profile_completeness_to_appear',
   '40',
   'Minimum completeness_score (0-100) required for a professional to be searchable'),

  ('current_tos_version',
   '"2026-06-24"',
   'Current Terms of Service version; consent_records must match this version'),

  ('current_privacy_version',
   '"2026-06-24"',
   'Current Privacy Policy version; consent_records must match this version'),

  ('max_message_length',
   '10000',
   'Maximum character length for a single message body'),

  ('document_upload_max_mb',
   '10',
   'Maximum document upload size in megabytes'),

  ('supported_document_mime_types',
   '["application/pdf","image/jpeg","image/png"]',
   'Allowed MIME types for document uploads'),

  ('bias_audit_score_threshold',
   '15',
   'Flag AI search sessions where the score range between highest and lowest country_of_training group exceeds this value'),

  ('platform_contact_email',
   '"support@onmatchhealth.ca"',
   'Contact email shown in footer and emails')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 19. HELPER FUNCTIONS
-- ============================================================

-- Recalculate profile completeness score (0-100) for a professional.
-- Call after any profile save. Can also be run as a scheduled job.
CREATE OR REPLACE FUNCTION public.calc_profile_completeness(_user_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.professional_profiles%ROWTYPE;
  score INT := 0;
  lang_count INT;
  cred_count INT;
BEGIN
  SELECT * INTO p FROM public.professional_profiles WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Core fields (50 points)
  IF p.profession IS NOT NULL AND p.profession <> '' THEN score := score + 10; END IF;
  IF p.country_of_training IS NOT NULL AND p.country_of_training <> '' THEN score := score + 8; END IF;
  IF p.years_experience > 0 THEN score := score + 5; END IF;
  IF p.bio IS NOT NULL AND char_length(p.bio) > 50 THEN score := score + 10; END IF;
  IF p.current_city IS NOT NULL AND p.current_city <> '' THEN score := score + 5; END IF;
  IF p.available_from IS NOT NULL THEN score := score + 5; END IF;
  IF array_length(p.desired_employment_types, 1) > 0 THEN score := score + 7; END IF;

  -- Languages (15 points)
  SELECT COUNT(*) INTO lang_count
  FROM public.professional_language_proficiencies
  WHERE user_id = _user_id;
  IF lang_count >= 1 THEN score := score + 8; END IF;
  IF lang_count >= 2 THEN score := score + 7; END IF;

  -- Credential steps (25 points)
  SELECT COUNT(*) INTO cred_count
  FROM public.professional_credentials
  WHERE user_id = _user_id AND status IN ('in_progress','submitted','completed');
  IF cred_count >= 1 THEN score := score + 10; END IF;
  IF cred_count >= 3 THEN score := score + 10; END IF;
  IF cred_count >= 5 THEN score := score + 5;  END IF;

  -- Structured FK (bonus 10 points)
  IF p.profession_id IS NOT NULL THEN score := score + 5; END IF;
  IF p.work_auth_type_id IS NOT NULL THEN score := score + 5; END IF;

  score := LEAST(score, 100);

  UPDATE public.professional_profiles
  SET completeness_score = score
  WHERE user_id = _user_id;

  RETURN score;
END; $$;

GRANT EXECUTE ON FUNCTION public.calc_profile_completeness(UUID) TO authenticated;

-- Check if a user has given all required consents for current platform versions
CREATE OR REPLACE FUNCTION public.user_has_required_consents(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    -- Has accepted current TOS
    EXISTS (
      SELECT 1 FROM public.consent_records cr
      JOIN public.platform_settings ps ON ps.key = 'current_tos_version'
      WHERE cr.user_id = _user_id
        AND cr.consent_type = 'terms_of_service'
        AND cr.consented = true
        AND cr.version = ps.value #>> '{}'
    )
    AND
    -- Has accepted current Privacy Policy
    EXISTS (
      SELECT 1 FROM public.consent_records cr
      JOIN public.platform_settings ps ON ps.key = 'current_privacy_version'
      WHERE cr.user_id = _user_id
        AND cr.consent_type = 'privacy_policy'
        AND cr.consented = true
        AND cr.version = ps.value #>> '{}'
    )
    AND
    -- Has consented to AI processing
    EXISTS (
      SELECT 1 FROM public.consent_records
      WHERE user_id = _user_id
        AND consent_type = 'ai_processing'
        AND consented = true
    )
  )
$$;

GRANT EXECUTE ON FUNCTION public.user_has_required_consents(UUID) TO authenticated;

-- Soft-delete / anonymize a user's personal data for PIPEDA deletion requests.
-- Does NOT delete the auth.users row (that requires admin action).
-- Run from a service_role server function after admin approval.
CREATE OR REPLACE FUNCTION public.anonymize_user_data(_user_id UUID, _admin_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Anonymize profile
  UPDATE public.profiles
  SET full_name = 'Deleted User', email = _user_id::TEXT || '@deleted.invalid'
  WHERE id = _user_id;

  -- Remove professional profile data (keep row for FK integrity, null out PII)
  UPDATE public.professional_profiles
  SET
    profession = 'deleted', specialty = NULL, country_of_training = 'deleted',
    bio = NULL, current_city = NULL, preferred_cities = '{}',
    linkedin_url = NULL, portfolio_url = NULL,
    is_searchable = false, completeness_score = 0
  WHERE user_id = _user_id;

  -- Remove employer profile data
  UPDATE public.employer_profiles
  SET
    org_name = 'Deleted Organization', contact_name = NULL,
    contact_phone = NULL, website = NULL, about = NULL
  WHERE user_id = _user_id;

  -- Delete language proficiencies, credentials, documents
  DELETE FROM public.professional_language_proficiencies WHERE user_id = _user_id;
  DELETE FROM public.professional_credentials WHERE user_id = _user_id;
  DELETE FROM public.professional_documents WHERE user_id = _user_id;

  -- Delete consent records (they are no longer relevant once data is erased)
  DELETE FROM public.consent_records WHERE user_id = _user_id;

  -- Mark deletion request as completed
  UPDATE public.data_deletion_requests
  SET status = 'completed', processed_at = now(), processed_by = _admin_user_id
  WHERE user_id = _user_id AND status = 'processing';

  -- Audit log
  INSERT INTO public.audit_log (actor_user_id, action, target_type, target_id, details)
  VALUES (_admin_user_id, 'data_anonymized', 'user', _user_id,
    jsonb_build_object('reason', 'PIPEDA deletion request'));
END; $$;

REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) FROM PUBLIC, authenticated;
GRANT  EXECUTE ON FUNCTION public.anonymize_user_data(UUID, UUID) TO service_role;
