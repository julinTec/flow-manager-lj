
DROP POLICY "Authenticated users can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
