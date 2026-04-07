
-- Fix privilege escalation: prevent users from updating their own verification_status
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, bio, avatar_url, university) ON public.profiles TO authenticated;
