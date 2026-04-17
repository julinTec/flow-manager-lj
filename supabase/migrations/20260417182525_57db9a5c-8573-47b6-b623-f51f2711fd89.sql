-- Add type to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'PJ';

-- Add fields to devis
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS meeting_date date;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS commercial_responsible uuid;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS meeting_summary text;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS down_payment_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS notes text;

-- Trigger to auto-calc down_payment_amount as 50% of total_amount when not explicitly set or changed via total
CREATE OR REPLACE FUNCTION public.calc_devis_down_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.down_payment_amount IS NULL OR NEW.down_payment_amount = 0 THEN
      NEW.down_payment_amount := COALESCE(NEW.total_amount, 0) * 0.5;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If total changed but down_payment was not explicitly changed, recompute
    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
       AND NEW.down_payment_amount IS NOT DISTINCT FROM OLD.down_payment_amount THEN
      NEW.down_payment_amount := COALESCE(NEW.total_amount, 0) * 0.5;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_devis_down_payment ON public.devis;
CREATE TRIGGER trg_calc_devis_down_payment
BEFORE INSERT OR UPDATE ON public.devis
FOR EACH ROW
EXECUTE FUNCTION public.calc_devis_down_payment();