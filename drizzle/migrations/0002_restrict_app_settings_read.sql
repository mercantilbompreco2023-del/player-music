DROP POLICY IF EXISTS "public read settings" ON public.app_settings;
CREATE POLICY "public read public settings" ON public.app_settings FOR SELECT TO anon, authenticated
USING (key IN ('home_greeting','demo_tracks_enabled') OR public.has_role(auth.uid(), 'admin'::app_role));