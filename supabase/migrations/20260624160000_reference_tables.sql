-- ============================================================
-- MIGRATION 003: Reference / Lookup Tables
--
-- These tables hold canonical vocabulary: professions, colleges,
-- credential steps, languages, regions, work auth types, etc.
-- They are read-only for authenticated users; only service_role
-- can insert/update (seed data comes from this migration file).
-- ============================================================

-- ============================================================
-- REGULATORY COLLEGES
-- ============================================================

CREATE TABLE public.ref_regulatory_colleges (
  id            TEXT PRIMARY KEY,           -- e.g. 'CNO', 'CPSO'
  name          TEXT NOT NULL,              -- short acronym display
  full_name     TEXT NOT NULL,
  website       TEXT,
  register_url  TEXT,                       -- link to public register
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ref_regulatory_colleges TO authenticated, anon;
GRANT ALL    ON public.ref_regulatory_colleges TO service_role;
ALTER TABLE public.ref_regulatory_colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_regulatory_colleges"
  ON public.ref_regulatory_colleges FOR SELECT USING (true);

INSERT INTO public.ref_regulatory_colleges (id, name, full_name, website, register_url) VALUES
  ('CNO',    'CNO',    'College of Nurses of Ontario',                              'https://www.cno.org',    'https://www.cno.org/en/public-registration/find-a-nurse/'),
  ('CPSO',   'CPSO',   'College of Physicians and Surgeons of Ontario',             'https://www.cpso.on.ca', 'https://www.cpso.on.ca/Public/Accessing-Care/Find-a-Doctor'),
  ('OCP',    'OCP',    'Ontario College of Pharmacists',                            'https://www.ocpinfo.com','https://www.ocpinfo.com/'),
  ('CPO',    'CPO',    'College of Physiotherapists of Ontario',                    'https://www.collegept.org', 'https://www.collegept.org/public/find-a-physiotherapist'),
  ('COTO',   'COTO',   'College of Occupational Therapists of Ontario',             'https://www.coto.org',   'https://www.coto.org/public-register/'),
  ('CRTO',   'CRTO',   'College of Respiratory Therapists of Ontario',              'https://www.crto.on.ca', 'https://www.crto.on.ca/Find-a-RT.aspx'),
  ('CMLTO',  'CMLTO',  'College of Medical Laboratory Technologists of Ontario',   'https://www.cmlto.com',  'https://www.cmlto.com/'),
  ('CDHO',   'CDHO',   'College of Dental Hygienists of Ontario',                  'https://www.cdho.org',   'https://www.cdho.org/public-register/'),
  ('CMO',    'CMO',    'College of Midwives of Ontario',                            'https://www.cmo.on.ca',  'https://www.cmo.on.ca/public/'),
  ('CCO',    'CCO',    'College of Chiropractors of Ontario',                       'https://www.cco.on.ca',  'https://www.cco.on.ca/public/find-a-chiropractor/'),
  ('CSWSSW', 'CSWSSW', 'Ontario College of Social Workers and Social Service Workers', 'https://www.ocswssw.org', 'https://www.ocswssw.org/members/member-search/'),
  ('CDTO',   'CDTO',   'College of Dietitians of Ontario',                          'https://www.collegeofdietitians.org', 'https://www.collegeofdietitians.org/'),
  ('CMRTO',  'CMRTO',  'College of Medical Radiation and Imaging Technologists of Ontario', 'https://www.cmrto.org', 'https://www.cmrto.org/public/find-a-technologist/'),
  ('CPPQ',   'CPPQ',   'College of Psychologists of Ontario',                       'https://www.cpo.on.ca',  'https://www.cpo.on.ca/public/'),
  ('RHPA',   'RHPA',   'Regulated Health Professions Act — no single college',       NULL, NULL);

-- ============================================================
-- PROFESSIONS
-- ============================================================

CREATE TABLE public.ref_professions (
  id           TEXT PRIMARY KEY,            -- e.g. 'registered_nurse'
  display_name TEXT NOT NULL,
  college_id   TEXT REFERENCES public.ref_regulatory_colleges(id),
  is_regulated BOOLEAN NOT NULL DEFAULT true,
  noc_codes    TEXT[] NOT NULL DEFAULT '{}', -- National Occupational Classification
  sort_order   INT NOT NULL DEFAULT 99,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ref_professions TO authenticated, anon;
GRANT ALL    ON public.ref_professions TO service_role;
ALTER TABLE public.ref_professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_professions"
  ON public.ref_professions FOR SELECT USING (true);

INSERT INTO public.ref_professions (id, display_name, college_id, is_regulated, noc_codes, sort_order) VALUES
  ('registered_nurse',              'Registered Nurse (RN)',                    'CNO',    true,  ARRAY['31301'], 1),
  ('nurse_practitioner',            'Nurse Practitioner (NP)',                  'CNO',    true,  ARRAY['31302'], 2),
  ('registered_practical_nurse',    'Registered Practical Nurse (RPN)',         'CNO',    true,  ARRAY['31303'], 3),
  ('physician',                     'Physician (MD)',                           'CPSO',   true,  ARRAY['31100','31102','31103'], 4),
  ('pharmacist',                    'Pharmacist',                               'OCP',    true,  ARRAY['31120'], 5),
  ('physiotherapist',               'Physiotherapist (PT)',                     'CPO',    true,  ARRAY['31202'], 6),
  ('occupational_therapist',        'Occupational Therapist (OT)',              'COTO',   true,  ARRAY['31203'], 7),
  ('respiratory_therapist',         'Respiratory Therapist (RT)',               'CRTO',   true,  ARRAY['32102'], 8),
  ('medical_lab_technologist',      'Medical Laboratory Technologist (MLT)',    'CMLTO',  true,  ARRAY['32120'], 9),
  ('dental_hygienist',              'Dental Hygienist (DH)',                    'CDHO',   true,  ARRAY['32113'], 10),
  ('midwife',                       'Midwife (RM)',                             'CMO',    true,  ARRAY['31305'], 11),
  ('chiropractor',                  'Chiropractor (DC)',                        'CCO',    true,  ARRAY['31201'], 12),
  ('social_worker',                 'Social Worker (MSW/RSW)',                  'CSWSSW', true,  ARRAY['41300','41301'], 13),
  ('dietitian',                     'Dietitian (RD)',                           'CDTO',   true,  ARRAY['31121'], 14),
  ('medical_radiation_technologist','Medical Radiation Technologist (MRT)',     'CMRTO',  true,  ARRAY['32121'], 15),
  ('psychologist',                  'Psychologist (C.Psych)',                   'CPPQ',   true,  ARRAY['31200'], 16),
  ('personal_support_worker',       'Personal Support Worker (PSW)',            NULL,     false, ARRAY['44101'], 17),
  ('health_care_aide',              'Health Care Aide (HCA)',                   NULL,     false, ARRAY['44101'], 18),
  ('paramedic',                     'Paramedic / Emergency Medical Technician', NULL,     false, ARRAY['32101'], 19),
  ('medical_office_admin',          'Medical Office Administrator',            NULL,     false, ARRAY['13112'], 20),
  ('other',                         'Other Health Profession',                  NULL,     false, ARRAY[]::TEXT[], 99);

-- ============================================================
-- SPECIALTIES
-- ============================================================

CREATE TABLE public.ref_specialties (
  id           TEXT PRIMARY KEY,
  profession_id TEXT NOT NULL REFERENCES public.ref_professions(id),
  display_name  TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 99
);

GRANT SELECT ON public.ref_specialties TO authenticated, anon;
GRANT ALL    ON public.ref_specialties TO service_role;
ALTER TABLE public.ref_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_specialties"
  ON public.ref_specialties FOR SELECT USING (true);

INSERT INTO public.ref_specialties (id, profession_id, display_name, sort_order) VALUES
  -- Nurse specialties
  ('rn_icu',          'registered_nurse', 'Intensive Care / Critical Care (ICU)',   1),
  ('rn_er',           'registered_nurse', 'Emergency',                              2),
  ('rn_or',           'registered_nurse', 'Perioperative / Operating Room',         3),
  ('rn_paeds',        'registered_nurse', 'Paediatrics',                            4),
  ('rn_ob',           'registered_nurse', 'Obstetrics / Labour & Delivery',         5),
  ('rn_med_surg',     'registered_nurse', 'Medical-Surgical',                       6),
  ('rn_oncology',     'registered_nurse', 'Oncology',                               7),
  ('rn_psych',        'registered_nurse', 'Mental Health / Psychiatry',             8),
  ('rn_ltc',          'registered_nurse', 'Long-Term Care',                         9),
  ('rn_community',    'registered_nurse', 'Community / Public Health',              10),
  ('rn_home_care',    'registered_nurse', 'Home Care',                              11),
  ('rn_nephrology',   'registered_nurse', 'Nephrology / Dialysis',                  12),
  ('rn_neuro',        'registered_nurse', 'Neurology / Neurosurgery',               13),
  ('rn_cardiac',      'registered_nurse', 'Cardiology / Cardiac Care',              14),
  ('rn_nicu',         'registered_nurse', 'Neonatal ICU (NICU)',                    15),
  -- Physician specialties
  ('md_fp',           'physician', 'Family Medicine / General Practice',            1),
  ('md_im',           'physician', 'Internal Medicine',                             2),
  ('md_surgery',      'physician', 'General Surgery',                               3),
  ('md_paeds',        'physician', 'Paediatrics',                                   4),
  ('md_ob_gyn',       'physician', 'Obstetrics & Gynaecology',                      5),
  ('md_er',           'physician', 'Emergency Medicine',                            6),
  ('md_anaes',        'physician', 'Anaesthesiology',                               7),
  ('md_psych',        'physician', 'Psychiatry',                                    8),
  ('md_radio',        'physician', 'Radiology / Diagnostic Imaging',                9),
  ('md_ortho',        'physician', 'Orthopaedic Surgery',                           10),
  ('md_cardio',       'physician', 'Cardiology',                                    11),
  ('md_oncology',     'physician', 'Oncology',                                      12),
  -- PT specialties
  ('pt_ortho',        'physiotherapist', 'Orthopaedics / Musculoskeletal',          1),
  ('pt_neuro',        'physiotherapist', 'Neurological Rehabilitation',             2),
  ('pt_cardio',       'physiotherapist', 'Cardiorespiratory',                       3),
  ('pt_paeds',        'physiotherapist', 'Paediatrics',                             4),
  ('pt_sports',       'physiotherapist', 'Sports',                                  5),
  -- OT specialties
  ('ot_mental_health','occupational_therapist', 'Mental Health',                    1),
  ('ot_physical_rehab','occupational_therapist','Physical Rehabilitation',          2),
  ('ot_paeds',        'occupational_therapist', 'Paediatrics',                      3),
  -- RT specialties
  ('rt_icu',          'respiratory_therapist', 'Critical Care / ICU',               1),
  ('rt_neonatal',     'respiratory_therapist', 'Neonatal',                          2),
  ('rt_sleep',        'respiratory_therapist', 'Sleep Disorders',                   3);

-- ============================================================
-- CREDENTIAL PATHWAY STEPS (per profession)
-- ============================================================

CREATE TABLE public.ref_credential_steps (
  id                    TEXT PRIMARY KEY,   -- e.g. 'rn_nnas_application'
  profession_id         TEXT NOT NULL REFERENCES public.ref_professions(id),
  step_order            INT NOT NULL,
  step_name             TEXT NOT NULL,
  description           TEXT,
  governing_body        TEXT,
  typical_duration_weeks INT,
  cost_cad              NUMERIC(8,2),
  info_url              TEXT
);

GRANT SELECT ON public.ref_credential_steps TO authenticated, anon;
GRANT ALL    ON public.ref_credential_steps TO service_role;
ALTER TABLE public.ref_credential_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_credential_steps"
  ON public.ref_credential_steps FOR SELECT USING (true);

-- RN credential pathway
INSERT INTO public.ref_credential_steps
  (id, profession_id, step_order, step_name, description, governing_body, typical_duration_weeks, cost_cad, info_url)
VALUES
  ('rn_nnas_application', 'registered_nurse', 1,
   'NNAS Application Submitted',
   'Create an account and submit your application to the National Nursing Assessment Service (NNAS). Required before CNO will accept your registration application.',
   'NNAS', 2, 650.00, 'https://nnas.ca'),

  ('rn_nnas_documents', 'registered_nurse', 2,
   'NNAS Documents Uploaded',
   'Upload official documents: nursing degree/diploma, transcripts, proof of registration in home country, language test results, ID.',
   'NNAS', 8, NULL, 'https://nnas.ca/applicants/document-submission/'),

  ('rn_nnas_assessment', 'registered_nurse', 3,
   'NNAS Assessment In Progress',
   'NNAS verifies your documents with your home country nursing body. This is the longest step — plan for 3–6 months.',
   'NNAS', 20, NULL, NULL),

  ('rn_nnas_advisory_report', 'registered_nurse', 4,
   'NNAS Advisory Report Received',
   'NNAS issues an Advisory Report summarizing your qualifications. This is sent directly to CNO when you are ready to apply.',
   'NNAS', 1, NULL, NULL),

  ('rn_cno_application', 'registered_nurse', 5,
   'CNO Registration Application Submitted',
   'Apply for a CNO Certificate of Registration. CNO reviews your NNAS Advisory Report to determine if additional requirements apply.',
   'CNO', 4, 200.00, 'https://www.cno.org/en/become-a-nurse/new-applicants/applicants-educated-outside-canada/'),

  ('rn_nclex_rn_eligible', 'registered_nurse', 6,
   'Approved to Write NCLEX-RN',
   'CNO notifies you that you are eligible to write the NCLEX-RN licensing exam.',
   'CNO / NCSBN', 1, NULL, NULL),

  ('rn_nclex_rn_registered', 'registered_nurse', 7,
   'Registered for NCLEX-RN',
   'Register for NCLEX-RN through Pearson VUE and pay the exam fee.',
   'NCSBN / Pearson VUE', 2, 360.00, 'https://www.ncsbn.org/nclex.htm'),

  ('rn_nclex_rn_passed', 'registered_nurse', 8,
   'NCLEX-RN Passed',
   'Successfully passed the NCLEX-RN licensing examination.',
   'NCSBN', NULL, NULL, NULL),

  ('rn_cno_registered', 'registered_nurse', 9,
   'CNO Certificate of Registration Granted',
   'You are now a Registered Nurse in Ontario. Your name appears on the CNO public register.',
   'CNO', 2, NULL, 'https://www.cno.org/en/public-registration/find-a-nurse/');

-- Physician credential pathway (simplified — actual path varies significantly by specialty/IMG route)
INSERT INTO public.ref_credential_steps
  (id, profession_id, step_order, step_name, description, governing_body, typical_duration_weeks, cost_cad, info_url)
VALUES
  ('md_mcc_registration', 'physician', 1,
   'MCC (Medical Council of Canada) Registration',
   'Register with the Medical Council of Canada and have your credentials assessed.',
   'MCC', 4, 1000.00, 'https://mcc.ca'),

  ('md_mccqe1', 'physician', 2,
   'MCCQE Part I Passed',
   'Pass the Medical Council of Canada Qualifying Examination Part I — a written computer-based exam.',
   'MCC', NULL, 1270.00, 'https://mcc.ca/examinations/mccqe1/'),

  ('md_nac_osce', 'physician', 3,
   'NAC OSCE (for IMGs)',
   'National Assessment Collaboration OSCE — for internationally trained physicians seeking residency. Required for CaRMS IMG stream.',
   'MCC', NULL, 1990.00, 'https://mcc.ca/examinations/nac/'),

  ('md_carms_match', 'physician', 4,
   'CaRMS Residency Match',
   'Match to a residency program in Ontario through the Canadian Resident Matching Service.',
   'CaRMS', NULL, NULL, 'https://carms.ca'),

  ('md_mccqe2', 'physician', 5,
   'MCCQE Part II (OSCE) Passed',
   'Pass the Medical Council of Canada Qualifying Examination Part II — a clinical skills exam.',
   'MCC', NULL, 1650.00, 'https://mcc.ca/examinations/mccqe2/'),

  ('md_cpso_application', 'physician', 6,
   'CPSO Registration Application Submitted',
   'Apply to the College of Physicians and Surgeons of Ontario for a certificate of registration.',
   'CPSO', 4, 1500.00, 'https://www.cpso.on.ca/Physicians/Registration'),

  ('md_cpso_registered', 'physician', 7,
   'CPSO Certificate of Registration Granted',
   'You are now a licensed physician in Ontario.',
   'CPSO', NULL, NULL, 'https://www.cpso.on.ca');

-- Pharmacist credential pathway
INSERT INTO public.ref_credential_steps
  (id, profession_id, step_order, step_name, description, governing_body, typical_duration_weeks, cost_cad, info_url)
VALUES
  ('pharm_pebc_evaluating', 'pharmacist', 1,
   'PEBC Evaluating Examination Passed',
   'Pass the Pharmacy Examining Board of Canada evaluating exam to confirm your international qualifications.',
   'PEBC', NULL, 2200.00, 'https://www.pebc.ca'),

  ('pharm_pebc_osce', 'pharmacist', 2,
   'PEBC Qualifying Examination (OSCE) Passed',
   'Pass the PEBC qualifying exam (OSCE format).',
   'PEBC', NULL, 1600.00, NULL),

  ('pharm_ocp_application', 'pharmacist', 3,
   'OCP Registration Application Submitted',
   'Apply to the Ontario College of Pharmacists for a certificate of registration.',
   'OCP', 4, 600.00, 'https://www.ocpinfo.com/registration/'),

  ('pharm_ocp_registered', 'pharmacist', 4,
   'OCP Certificate of Registration Granted',
   'You are now a registered pharmacist in Ontario.',
   'OCP', NULL, NULL, NULL);

-- PT credential pathway
INSERT INTO public.ref_credential_steps
  (id, profession_id, step_order, step_name, description, governing_body, typical_duration_weeks, cost_cad, info_url)
VALUES
  ('pt_cpta_assessment', 'physiotherapist', 1,
   'CAPR Credential Assessment',
   'Submit credentials to the Canadian Alliance of Physiotherapy Regulators (CAPR) for assessment.',
   'CAPR', 12, 650.00, 'https://www.physiotherapyeducation.ca'),

  ('pt_pce_written', 'physiotherapist', 2,
   'Physiotherapy Competency Exam — Written Component Passed',
   'Pass the written component of the Physiotherapy Competency Examination (PCE).',
   'CAPR', NULL, 760.00, NULL),

  ('pt_pce_clinical', 'physiotherapist', 3,
   'Physiotherapy Competency Exam — Clinical Component Passed',
   'Pass the clinical component (OSCE) of the PCE.',
   'CAPR', NULL, 1750.00, NULL),

  ('pt_cpo_registered', 'physiotherapist', 4,
   'CPO Certificate of Registration Granted',
   'You are now a registered physiotherapist in Ontario.',
   'CPO', 4, 200.00, 'https://www.collegept.org');

-- ============================================================
-- LANGUAGES
-- ============================================================

CREATE TABLE public.ref_languages (
  code        TEXT PRIMARY KEY,  -- ISO 639-1
  name        TEXT NOT NULL,
  native_name TEXT,
  sort_order  INT NOT NULL DEFAULT 99
);

GRANT SELECT ON public.ref_languages TO authenticated, anon;
GRANT ALL    ON public.ref_languages TO service_role;
ALTER TABLE public.ref_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_languages"
  ON public.ref_languages FOR SELECT USING (true);

INSERT INTO public.ref_languages (code, name, native_name, sort_order) VALUES
  ('en', 'English',    'English',       1),
  ('fr', 'French',     'Français',      2),
  ('tl', 'Tagalog',    'Tagalog',       3),
  ('hi', 'Hindi',      'हिन्दी',          4),
  ('pa', 'Punjabi',    'ਪੰਜਾਬੀ',          5),
  ('ur', 'Urdu',       'اردو',           6),
  ('ar', 'Arabic',     'العربية',        7),
  ('zh', 'Mandarin',   '普通话',          8),
  ('yue','Cantonese',  '廣東話',          9),
  ('es', 'Spanish',    'Español',       10),
  ('pt', 'Portuguese', 'Português',     11),
  ('so', 'Somali',     'Soomaali',      12),
  ('sw', 'Swahili',    'Kiswahili',     13),
  ('ko', 'Korean',     '한국어',          14),
  ('ta', 'Tamil',      'தமிழ்',          15),
  ('bn', 'Bengali',    'বাংলা',          16),
  ('am', 'Amharic',    'አማርኛ',          17),
  ('vi', 'Vietnamese', 'Tiếng Việt',    18),
  ('fa', 'Persian/Dari','فارسی',        19),
  ('ro', 'Romanian',   'Română',        20),
  ('uk', 'Ukrainian',  'Українська',    21),
  ('pl', 'Polish',     'Polski',        22),
  ('ru', 'Russian',    'Русский',       23),
  ('yo', 'Yoruba',     'Yorùbá',        24),
  ('ig', 'Igbo',       'Igbo',          25),
  ('gu', 'Gujarati',   'ગુજરાતી',        26),
  ('mr', 'Marathi',    'मराठी',          27),
  ('ml', 'Malayalam',  'മലയാളം',        28),
  ('te', 'Telugu',     'తెలుగు',         29),
  ('si', 'Sinhala',    'සිංහල',          30),
  ('ne', 'Nepali',     'नेपाली',          31),
  ('other', 'Other',   NULL,           99);

-- ============================================================
-- LANGUAGE PROFICIENCY TESTS
-- ============================================================

CREATE TABLE public.ref_language_tests (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  full_name               TEXT,
  language                TEXT NOT NULL DEFAULT 'en',  -- 'en' or 'fr'
  accepted_by_professions TEXT[] NOT NULL DEFAULT '{}',
  website                 TEXT,
  notes                   TEXT
);

GRANT SELECT ON public.ref_language_tests TO authenticated, anon;
GRANT ALL    ON public.ref_language_tests TO service_role;
ALTER TABLE public.ref_language_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_language_tests"
  ON public.ref_language_tests FOR SELECT USING (true);

INSERT INTO public.ref_language_tests (id, name, full_name, language, accepted_by_professions, website, notes) VALUES
  ('IELTS',  'IELTS',  'International English Language Testing System',                       'en', ARRAY['registered_nurse','physiotherapist','pharmacist','occupational_therapist','physician'], 'https://ielts.org', 'Academic version required for most health colleges'),
  ('CELBAN', 'CELBAN', 'Canadian English Language Benchmark Assessment for Nurses',           'en', ARRAY['registered_nurse','registered_practical_nurse','nurse_practitioner'], 'https://www.celban.org', 'CNO preferred test; minimum CLB 7'),
  ('OET',    'OET',    'Occupational English Test',                                           'en', ARRAY['registered_nurse','physician','pharmacist','physiotherapist'], 'https://www.occupationalenglishtest.org', 'Health-specific context; accepted by many Ontario colleges'),
  ('TOEFL',  'TOEFL',  'Test of English as a Foreign Language',                              'en', ARRAY['physician','pharmacist'], 'https://www.ets.org/toefl', 'Accepted by some colleges as alternative'),
  ('TEF',    'TEF',    'Test d''évaluation de français',                                      'fr', ARRAY[]::TEXT[], 'https://www.fda.ccip.ca/tef', 'Required for French-language roles'),
  ('TCF',    'TCF',    'Test de connaissance du français',                                    'fr', ARRAY[]::TEXT[], 'https://www.france-education-international.fr/tcf', NULL);

-- ============================================================
-- ONTARIO REGIONS / CITIES
-- ============================================================

CREATE TABLE public.ref_ontario_regions (
  id              TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  region_category TEXT NOT NULL CHECK (region_category IN ('city', 'region', 'lhin')),
  population_tier INT  NOT NULL DEFAULT 3  -- 1=major, 2=mid, 3=small
);

GRANT SELECT ON public.ref_ontario_regions TO authenticated, anon;
GRANT ALL    ON public.ref_ontario_regions TO service_role;
ALTER TABLE public.ref_ontario_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_ontario_regions"
  ON public.ref_ontario_regions FOR SELECT USING (true);

INSERT INTO public.ref_ontario_regions (id, display_name, region_category, population_tier) VALUES
  ('toronto',         'Toronto',                        'city',   1),
  ('ottawa',          'Ottawa',                         'city',   1),
  ('mississauga',     'Mississauga',                    'city',   1),
  ('brampton',        'Brampton',                       'city',   1),
  ('hamilton',        'Hamilton',                       'city',   2),
  ('london',          'London',                         'city',   2),
  ('markham',         'Markham',                        'city',   2),
  ('vaughan',         'Vaughan',                        'city',   2),
  ('kitchener',       'Kitchener-Waterloo',             'city',   2),
  ('windsor',         'Windsor',                        'city',   2),
  ('richmond_hill',   'Richmond Hill',                  'city',   2),
  ('oakville',        'Oakville',                       'city',   2),
  ('burlington',      'Burlington',                     'city',   2),
  ('oshawa',          'Oshawa',                         'city',   2),
  ('sudbury',         'Greater Sudbury',                'city',   2),
  ('barrie',          'Barrie',                         'city',   2),
  ('kingston',        'Kingston',                       'city',   2),
  ('guelph',          'Guelph',                         'city',   2),
  ('cambridge',       'Cambridge',                      'city',   2),
  ('thunder_bay',     'Thunder Bay',                    'city',   2),
  ('st_catharines',   'St. Catharines-Niagara',         'city',   2),
  ('ajax',            'Ajax-Whitby-Pickering',          'city',   2),
  ('peel',            'Peel Region',                    'region', 1),
  ('york',            'York Region',                    'region', 1),
  ('durham',          'Durham Region',                  'region', 1),
  ('halton',          'Halton Region',                  'region', 2),
  ('niagara',         'Niagara Region',                 'region', 2),
  ('waterloo',        'Waterloo Region',                'region', 2),
  ('simcoe',          'Simcoe County',                  'region', 3),
  ('grey_bruce',      'Grey-Bruce',                     'region', 3),
  ('huron_perth',     'Huron-Perth',                    'region', 3),
  ('north_bay',       'North Bay Area',                 'city',   3),
  ('sault_ste_marie', 'Sault Ste. Marie',               'city',   3),
  ('kenora',          'Kenora / Northwestern Ontario',  'region', 3),
  ('northwestern_on', 'Northwestern Ontario (remote)',  'region', 3),
  ('northeastern_on', 'Northeastern Ontario (remote)',  'region', 3),
  ('remote_on',       'Open to Remote / Virtual Care',  'region', 2);

-- ============================================================
-- COUNTRIES (focused on top ITHP source countries for Ontario)
-- ============================================================

CREATE TABLE public.ref_countries (
  code   TEXT PRIMARY KEY,  -- ISO 3166-1 alpha-2
  name   TEXT NOT NULL,
  region TEXT
);

GRANT SELECT ON public.ref_countries TO authenticated, anon;
GRANT ALL    ON public.ref_countries TO service_role;
ALTER TABLE public.ref_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_countries"
  ON public.ref_countries FOR SELECT USING (true);

INSERT INTO public.ref_countries (code, name, region) VALUES
  -- Top source countries for ITHPs in Ontario
  ('PH', 'Philippines',             'Southeast Asia'),
  ('IN', 'India',                   'South Asia'),
  ('NG', 'Nigeria',                 'Sub-Saharan Africa'),
  ('PK', 'Pakistan',                'South Asia'),
  ('EG', 'Egypt',                   'North Africa / Middle East'),
  ('GH', 'Ghana',                   'Sub-Saharan Africa'),
  ('KE', 'Kenya',                   'Sub-Saharan Africa'),
  ('ZA', 'South Africa',            'Sub-Saharan Africa'),
  ('ET', 'Ethiopia',                'Sub-Saharan Africa'),
  ('CN', 'China',                   'East Asia'),
  ('KR', 'South Korea',             'East Asia'),
  ('LK', 'Sri Lanka',               'South Asia'),
  ('BD', 'Bangladesh',              'South Asia'),
  ('NP', 'Nepal',                   'South Asia'),
  ('IQ', 'Iraq',                    'Middle East'),
  ('IR', 'Iran',                    'Middle East'),
  ('SY', 'Syria',                   'Middle East'),
  ('JO', 'Jordan',                  'Middle East'),
  ('LB', 'Lebanon',                 'Middle East'),
  ('SA', 'Saudi Arabia',            'Middle East'),
  ('RO', 'Romania',                 'Eastern Europe'),
  ('UA', 'Ukraine',                 'Eastern Europe'),
  ('PL', 'Poland',                  'Eastern Europe'),
  ('RU', 'Russia',                  'Eastern Europe'),
  ('GB', 'United Kingdom',          'Western Europe'),
  ('IE', 'Ireland',                 'Western Europe'),
  ('AU', 'Australia',               'Oceania'),
  ('NZ', 'New Zealand',             'Oceania'),
  ('US', 'United States',           'North America'),
  ('MX', 'Mexico',                  'Latin America'),
  ('BR', 'Brazil',                  'Latin America'),
  ('CO', 'Colombia',                'Latin America'),
  ('VN', 'Vietnam',                 'Southeast Asia'),
  ('TH', 'Thailand',                'Southeast Asia'),
  ('ID', 'Indonesia',               'Southeast Asia'),
  ('MY', 'Malaysia',                'Southeast Asia'),
  ('JM', 'Jamaica',                 'Caribbean'),
  ('TT', 'Trinidad and Tobago',     'Caribbean'),
  ('HT', 'Haiti',                   'Caribbean'),
  ('SO', 'Somalia',                 'Sub-Saharan Africa'),
  ('SD', 'Sudan',                   'Sub-Saharan Africa'),
  ('CM', 'Cameroon',                'Sub-Saharan Africa'),
  ('CA', 'Canada',                  'North America'),  -- some Canadian-trained ITHPs
  ('other', 'Other Country',        NULL);

-- ============================================================
-- WORK AUTHORIZATION TYPES
-- Designed for privacy: professionals see their real status;
-- employers see only a privacy-safe derived label.
-- ============================================================

CREATE TABLE public.ref_work_auth_types (
  id                          TEXT PRIMARY KEY,
  display_name                TEXT NOT NULL,   -- shown to the professional
  employer_display            TEXT NOT NULL,   -- shown to employers (privacy-safe)
  requires_sponsorship        BOOLEAN NOT NULL DEFAULT false,
  can_work_immediately        BOOLEAN NOT NULL DEFAULT true,
  notes                       TEXT
);

GRANT SELECT ON public.ref_work_auth_types TO authenticated, anon;
GRANT ALL    ON public.ref_work_auth_types TO service_role;
ALTER TABLE public.ref_work_auth_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_work_auth_types"
  ON public.ref_work_auth_types FOR SELECT USING (true);

INSERT INTO public.ref_work_auth_types
  (id, display_name, employer_display, requires_sponsorship, can_work_immediately, notes)
VALUES
  ('citizen',
   'Canadian Citizen',
   'Work-authorized (no sponsorship needed)',
   false, true,
   'Full work rights. Cannot be treated differently from PR under Ontario Human Rights Code.'),

  ('permanent_resident',
   'Permanent Resident (PR)',
   'Work-authorized (no sponsorship needed)',
   false, true,
   'Full work rights. Equal to citizens for employment purposes under OHRC and CHRA.'),

  ('open_work_permit_pgwp',
   'Open Work Permit — Post-Graduate (PGWP)',
   'Work-authorized (open permit)',
   false, true,
   'Graduates of Canadian universities. Valid for up to 3 years.'),

  ('open_work_permit_spouse',
   'Open Work Permit — Spousal / Dependent',
   'Work-authorized (open permit)',
   false, true,
   'Spouse/partner of a skilled worker or student.'),

  ('open_work_permit_bowp',
   'Bridging Open Work Permit (BOWP)',
   'Work-authorized (permit; PR in process)',
   false, true,
   'Issued while PR application is being processed.'),

  ('open_work_permit_other',
   'Open Work Permit — Other',
   'Work-authorized (open permit)',
   false, true,
   'Includes IEC, refugee claimant with authorization, etc.'),

  ('employer_specific_permit',
   'Employer-Specific Work Permit',
   'Requires permit transfer (no LMIA needed in some cases)',
   false, false,
   'Currently tied to another employer. Transferable if new employer uses same LMIA or exempt category.'),

  ('lmia_required',
   'Requires Employer LMIA Sponsorship',
   'Requires employer sponsorship (LMIA)',
   true, false,
   'Employer must obtain a Labour Market Impact Assessment from ESDC before hiring.'),

  ('refugee_work_auth',
   'Protected Person / Refugee Claimant (Work Authorized)',
   'Work-authorized (protected status)',
   false, true,
   'Includes Convention Refugees and protected persons with valid work authorization.'),

  ('study_permit_coop',
   'Study Permit with Co-op / Work Authorization',
   'Limited work authorization',
   false, false,
   'Can work during co-op or part-time. Verify hours allowed.'),

  ('prefer_not_to_say',
   'Prefer not to disclose',
   'Not disclosed',
   false, false,
   'Professional has chosen not to share work authorization details. Contact to discuss eligibility.');

-- ============================================================
-- EMPLOYER ORGANIZATION TYPES
-- ============================================================

CREATE TABLE public.ref_org_types (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 99
);

GRANT SELECT ON public.ref_org_types TO authenticated, anon;
GRANT ALL    ON public.ref_org_types TO service_role;
ALTER TABLE public.ref_org_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ref_org_types"
  ON public.ref_org_types FOR SELECT USING (true);

INSERT INTO public.ref_org_types (id, display_name, sort_order) VALUES
  ('hospital_teaching',    'Teaching Hospital',                         1),
  ('hospital_community',   'Community Hospital',                        2),
  ('hospital_specialty',   'Specialty Hospital',                        3),
  ('ltc',                  'Long-Term Care Facility',                   4),
  ('retirement',           'Retirement Home',                           5),
  ('home_care',            'Home Care Agency',                          6),
  ('primary_care',         'Primary Care Clinic / Family Health Team',  7),
  ('specialist_clinic',    'Specialist Clinic',                         8),
  ('mental_health',        'Mental Health Organization',                9),
  ('addictions',           'Addictions / Substance Use Services',       10),
  ('public_health',        'Public Health Unit',                        11),
  ('community_health',     'Community Health Centre (CHC)',             12),
  ('rehab_centre',         'Rehabilitation Centre',                     13),
  ('diagnostic',           'Diagnostic Imaging / Lab',                  14),
  ('pharmacy',             'Pharmacy / Pharmacy Group',                 15),
  ('dental',               'Dental / Oral Health',                      16),
  ('indigenous_health',    'Indigenous Health Organization',            17),
  ('correctional_health',  'Correctional / Justice Health Services',    18),
  ('telemedicine',         'Telemedicine / Virtual Care',               19),
  ('staffing_agency',      'Healthcare Staffing Agency',                20),
  ('government',           'Government / Ministry of Health',           21),
  ('research',             'Research Institute / Academic',             22),
  ('other',                'Other',                                     99);
