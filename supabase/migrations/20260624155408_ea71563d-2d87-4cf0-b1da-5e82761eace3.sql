
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role is used by RLS policies which run as the policy owner, so revoking from public/anon is sufficient.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
