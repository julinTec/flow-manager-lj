ALTER TABLE public.devis
  ADD COLUMN IF NOT EXISTS meeting_report text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS responsible_sector text,
  ADD COLUMN IF NOT EXISTS scope_description text,
  ADD COLUMN IF NOT EXISTS proposal_structure text;