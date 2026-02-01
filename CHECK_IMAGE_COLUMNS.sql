SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties' AND column_name LIKE '%image%' ORDER BY column_name;
