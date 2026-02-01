-- =========================================================
-- VERIFICATION SCRIPT: PROOF OF LIFE
-- =========================================================
-- Run this script to verify the notification system is working 100%.

DO $$
DECLARE
    v_contact_id uuid;
    v_log_count int;
BEGIN
    -- 1. Insert a Test Contact Message (simulating a user inquiry)
    INSERT INTO public.contact_messages (name, email, message)
    VALUES ('Trigger Test', 'test@rebal.site', 'Testing admin notification trigger...')
    RETURNING id INTO v_contact_id;

    -- 2. Check if the Trigger fired and created a Log entry
    SELECT count(*) INTO v_log_count
    FROM public.admin_notifications_log
    WHERE metadata->>'contact_id' = v_contact_id::text;

    -- 3. Output Result
    IF v_log_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Notification Trigger fired correctly! (Log found for Contact ID: %)', v_contact_id;
    ELSE
        RAISE EXCEPTION '❌ FAILURE: Trigger did NOT fire. No notification found for Contact ID: %', v_contact_id;
    END IF;
    
    -- 4. Cleanup (Optional: remove the test data so it doesn't clutter)
    -- DELETE FROM public.contact_messages WHERE id = v_contact_id;
    -- DELETE FROM public.admin_notifications_log WHERE metadata->>'contact_id' = v_contact_id::text;
    
    RAISE NOTICE 'Test Complete. You can now rely on the system.';
END $$;
