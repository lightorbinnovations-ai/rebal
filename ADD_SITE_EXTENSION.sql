-- Add .site extension to domain_pricing
INSERT INTO public.domain_pricing (extension, yearly_price, is_available)
VALUES ('.site', 3500, true)
ON CONFLICT (extension) DO UPDATE
SET yearly_price = EXCLUDED.yearly_price, is_available = EXCLUDED.is_available;
