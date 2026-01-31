-- First, let's see what plans currently exist
-- Run this first to check current data:
-- SELECT id, name, monthly_price FROM subscription_plans ORDER BY monthly_price;

-- Then run this to fix everything:

-- Step 1: Deactivate any old plans we don't want
UPDATE subscription_plans 
SET is_active = false 
WHERE id NOT IN ('trial', 'starter', 'pro', 'business');

-- Step 2: Delete the old Premium plan if it exists
DELETE FROM subscription_plans WHERE id = 'premium';

-- Step 3: UPSERT all correct plans
INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, max_properties, features, is_active)
VALUES (
  'trial',
  'Free Trial',
  '14-day free trial to explore REBAL',
  0,
  0,
  1,
  '["1 property listing", "Basic company profile", "Inquiry form", "Email support"]'::jsonb,
  true
)
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_properties = EXCLUDED.max_properties,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, max_properties, features, is_active)
VALUES (
  'starter',
  'Starter',
  'Perfect for getting started',
  3000,
  30000,
  10,
  '["10 property listings", "Basic analytics", "Custom short links", "Rich social previews", "Email support"]'::jsonb,
  true
)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_properties = EXCLUDED.max_properties,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, max_properties, features, is_active)
VALUES (
  'pro',
  'Pro',
  'For growing agencies',
  8000,
  80000,
  50,
  '["50 property listings", "Advanced analytics", "Custom branding", "Lead scoring", "Priority support", "Custom short codes"]'::jsonb,
  true
)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_properties = EXCLUDED.max_properties,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

INSERT INTO subscription_plans (id, name, description, monthly_price, yearly_price, max_properties, features, is_active)
VALUES (
  'business',
  'Business',
  'For established agencies',
  20000,
  200000,
  999999,
  '["Unlimited listings", "Everything in Pro", "Custom domain (add-on)", "Custom email (add-on)", "API access", "Verification badge", "Dedicated account manager"]'::jsonb,
  true
)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  max_properties = EXCLUDED.max_properties,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
