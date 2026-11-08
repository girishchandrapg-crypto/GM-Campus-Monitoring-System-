CREATE TABLE public.attendance_marks (
 date date NOT NULL,
 subject text NOT NULL CHECK (length(trim(subject)) BETWEEN 1 AND 100),
 year integer NOT NULL CHECK (year BETWEEN 1 AND 4),
 student_id text NOT NULL CHECK (length(trim(student_id)) BETWEEN 1 AND 100),
 present boolean NOT NULL,
 PRIMARY KEY (date, subject, year, student_id)
);
GRANT SELECT, INSERT, UPDATE ON public.attendance_marks TO authenticated;
GRANT ALL ON public.attendance_marks TO service_role;
ALTER TABLE public.attendance_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY faculty_read_attendance ON public.attendance_marks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'faculty') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.faculty_subject = attendance_marks.subject));
CREATE POLICY student_read_own_attendance ON public.attendance_marks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.student_id = attendance_marks.student_id));
CREATE POLICY faculty_insert_attendance ON public.attendance_marks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'faculty') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.faculty_subject = attendance_marks.subject));
CREATE POLICY faculty_update_attendance ON public.attendance_marks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'faculty') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.faculty_subject = attendance_marks.subject)) WITH CHECK (public.has_role(auth.uid(), 'faculty') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.faculty_subject = attendance_marks.subject));
CREATE FUNCTION public.validate_attendance_day() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.date > (now() AT TIME ZONE 'Asia/Kolkata')::date OR extract(dow FROM NEW.date) = 0 THEN RAISE EXCEPTION 'Attendance must be submitted for a past or current Monday through Saturday.'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validate_attendance_day BEFORE INSERT OR UPDATE ON public.attendance_marks FOR EACH ROW EXECUTE FUNCTION public.validate_attendance_day();