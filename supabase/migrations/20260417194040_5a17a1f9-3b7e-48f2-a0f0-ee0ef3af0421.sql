ALTER TABLE public.devis
  ADD COLUMN IF NOT EXISTS validation_client_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_service_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_sector_defined boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_amount_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_deadline_defined boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS validated_by uuid NULL,
  ADD COLUMN IF NOT EXISTS deadline_date date NULL;