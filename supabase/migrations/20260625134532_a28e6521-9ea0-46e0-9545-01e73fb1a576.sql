
DROP VIEW IF EXISTS public.searchable_professional_profiles;

-- SECURITY DEFINER function for employers to search professionals
-- Excludes raw work_authorization and work_auth_type_id
CREATE OR REPLACE FUNCTION public.search_professional_profiles(
  _profession_id uuid DEFAULT NULL,
  _work_authorized_only boolean DEFAULT false,
  _min_years_experience int DEFAULT NULL,
  _limit int DEFAULT 80
)
RETURNS TABLE (
  user_id uuid,
  profession text,
  profession_id uuid,
  specialty text,
  country_of_training text,
  years_experience int,
  languages text[],
  credentials_status text,
  license_exam_status text,
  work_authorized_without_sponsorship boolean,
  currently_in_canada boolean,
  current_city text,
  preferred_cities text[],
  willing_to_relocate boolean,
  desired_role_types text[],
  desired_employment_types text[],
  available_from date,
  bio text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'employer'::public.app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id, p.profession, p.profession_id, p.specialty,
    p.country_of_training, p.years_experience, p.languages,
    p.credentials_status, p.license_exam_status,
    p.work_authorized_without_sponsorship,
    p.currently_in_canada, p.current_city, p.preferred_cities,
    p.willing_to_relocate, p.desired_role_types, p.desired_employment_types,
    p.available_from, p.bio
  FROM public.professional_profiles p
  WHERE p.is_searchable = true
    AND (_profession_id IS NULL OR p.profession_id = _profession_id)
    AND (NOT _work_authorized_only OR p.work_authorized_without_sponsorship = true)
    AND (_min_years_experience IS NULL OR p.years_experience >= _min_years_experience)
  LIMIT GREATEST(LEAST(_limit, 200), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.search_professional_profiles(uuid, boolean, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_professional_profiles(uuid, boolean, int, int) TO authenticated;
