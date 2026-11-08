CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE identifier text; raw text := trim(COALESCE(NEW.raw_user_meta_data->>'login_id', NEW.raw_user_meta_data->>'student_id','')); BEGIN
  IF lower(NEW.email) = 'admin@gmu.ac.in' THEN
    identifier := CASE WHEN raw ~ '^[A-Z][A-Z0-9_-]{1,29}$' THEN raw ELSE 'ADMIN' END;
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'faculty' THEN
    identifier := NULL;
  ELSE
    identifier := NULLIF(upper(raw),'');
    IF identifier = 'ADMIN' OR EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='admin' WHERE p.login_id = identifier) THEN RAISE EXCEPTION 'This sign-in ID is reserved.'; END IF;
  END IF;
  INSERT INTO public.profiles (id, full_name, student_id, login_id) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), CASE WHEN identifier ~ '^GMU[0-9]{4}$' THEN identifier ELSE NULL END, identifier);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, CASE WHEN lower(NEW.email) = 'admin@gmu.ac.in' THEN 'admin'::public.app_role ELSE 'student'::public.app_role END);
  RETURN NEW; END $function$;

CREATE OR REPLACE FUNCTION public.resolve_campus_login(_login_id text)
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE raw text := trim(_login_id); name_key text := lower(regexp_replace(trim(_login_id), '\s+', ' ', 'g')); result text; n integer;
BEGIN
  IF upper(raw) = 'ADMIN' OR EXISTS (SELECT 1 FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='admin' WHERE p.login_id = upper(raw)) THEN
    SELECT u.email::text INTO result FROM public.profiles p JOIN auth.users u ON u.id = p.id
      JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'admin' WHERE p.login_id = raw LIMIT 1;
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