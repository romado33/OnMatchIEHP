
-- Allow employers to read the public name/profile of candidates they have shortlisted.
-- This is intentional: the employer has already saved this person, so knowing their name is appropriate.
CREATE POLICY "employers can read shortlisted candidate profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.shortlists s
      WHERE s.employer_user_id = auth.uid()
        AND s.professional_user_id = profiles.id
    )
  );
