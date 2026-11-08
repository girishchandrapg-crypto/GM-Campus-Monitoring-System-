CREATE OR REPLACE FUNCTION public.resolve_campus_login(_login_id text)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE raw text := trim(_login_id); name_key text := lower(regexp_replace(trim(_login_id), '\s+', ' ', 'g')); result text; n integer;
BEGIN
  IF upper(raw) = 'ADMIN' THEN
    IF raw <> 'ADMIN' THEN RETURN NULL; END IF;
    SELECT u.email::text INTO result FROM public.profiles p JOIN auth.users u ON u.id = p.id
      JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'admin' WHERE p.login_id = 'ADMIN' LIMIT 1;
    RETURN result;
  END IF;
  SELECT count(*) INTO n FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'faculty'
    WHERE lower(regexp_replace(trim(p.full_name), '\s+', ' ', 'g')) = name_key;
  IF n = 1 THEN
    SELECT u.email::text INTO result FROM public.profiles p JOIN auth.users u ON u.id = p.id
      JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'faculty'
      WHERE lower(regexp_replace(trim(p.full_name), '\s+', ' ', 'g')) = name_key LIMIT 1;
    RETURN result;
  ELSIF n > 1 THEN RETURN NULL; END IF;
  SELECT u.email::text INTO result FROM public.profiles p JOIN auth.users u ON u.id = p.id
    WHERE p.login_id = upper(raw)
      AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role IN ('admin','faculty'))
    LIMIT 1;
  RETURN result;
END $function$;
REVOKE ALL ON FUNCTION public.resolve_campus_login(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_campus_login(text) TO service_role;