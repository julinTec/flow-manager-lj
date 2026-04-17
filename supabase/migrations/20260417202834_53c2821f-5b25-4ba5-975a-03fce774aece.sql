ALTER TABLE public.services ADD COLUMN IF NOT EXISTS responsible_sector text;

CREATE UNIQUE INDEX IF NOT EXISTS services_devis_id_unique ON public.services(devis_id) WHERE devis_id IS NOT NULL;

ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'a_iniciar';