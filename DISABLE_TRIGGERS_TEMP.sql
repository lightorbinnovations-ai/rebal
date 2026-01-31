-- EMERGENCY: DISABLE TRIGGERS TEMPORARILY
-- This will restore functionality while we debug

-- Disable the problematic triggers
ALTER TABLE public.contact_messages DISABLE TRIGGER on_new_inquiry;
ALTER TABLE public.support_tickets DISABLE TRIGGER on_new_ticket;

-- Test if contact form works now
-- After testing, we can re-enable with:
-- ALTER TABLE public.contact_messages ENABLE TRIGGER on_new_inquiry;
-- ALTER TABLE public.support_tickets ENABLE TRIGGER on_new_ticket;
