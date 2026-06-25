
DROP POLICY IF EXISTS "users insert own role" ON public.user_roles;
CREATE POLICY "users insert own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'professional'::public.app_role
  );

CREATE OR REPLACE FUNCTION public.assign_employer_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'employer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_employer_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_employer_role() TO authenticated;
