ALTER TABLE public.devis
  ADD COLUMN IF NOT EXISTS accept_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_ip text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Backfill: garantir token para linhas existentes (DEFAULT já cobre, mas reforçamos)
UPDATE public.devis SET accept_token = gen_random_uuid() WHERE accept_token IS NULL;

-- Unicidade do token
CREATE UNIQUE INDEX IF NOT EXISTS devis_accept_token_key ON public.devis(accept_token);