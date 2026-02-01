-- REMOVE DUPLICATE FREE PLAN
-- You have 'trial' (correct) and 'free' (redundant)
-- We will delete the 'free' plan.

DELETE FROM public.subscription_plans 
WHERE id = 'free';
