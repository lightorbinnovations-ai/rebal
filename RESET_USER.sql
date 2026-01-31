-- DELETE CORRUPTED USER
-- If the manual insert messed up the password hash or metadata, login will error forever.
-- Let's wipe it clean so you can sign up normally.

DELETE FROM auth.users WHERE email = 'rebalpros@gmail.com';
DELETE FROM public.companies WHERE email = 'rebalpros@gmail.com';
DELETE FROM public.user_roles WHERE user_id = 'f7058488-e59d-4a94-8622-c4e477279d40'; -- clean up potential orphan
