-- Seed Data RPC Function
-- Allows Admin to generate 30 mock users

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION seed_database_data()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_company_slug text;
  v_plan text;
  v_property_count int;
  v_property_id uuid;
  i int;
  j int;
  v_status text;
  v_promoted boolean;
BEGIN
  -- Ensure Subscription Plans exist
  INSERT INTO public.subscription_plans (id, name, description, monthly_price, yearly_price, features, max_properties, is_active)
  VALUES 
    ('free', 'Free Plan', 'Basic features', 0, 0, '["1 property listing", "Basic analytics"]', 1, true),
    ('starter', 'Starter Plan', 'For individual agents', 500000, 5000000, '["10 listings", "Standard support"]', 10, true),
    ('pro', 'Pro Plan', 'For small agencies', 1500000, 15000000, '["50 listings", "Priority support", "Branding"]', 50, true),
    ('business', 'Business Plan', 'For large agencies', 5000000, 50000000, '["Unlimited listings", "Dedicated support", "API Access"]', 9999, true)
  ON CONFLICT (id) DO NOTHING;

  -- Create 30 Users
  FOR i IN 1..30 LOOP
    -- Generate UUIDs
    v_user_id := gen_random_uuid();
    v_company_id := gen_random_uuid();
    v_company_slug := 'test-company-' || floor(extract(epoch from now())) || '-' || i;
    
    -- Pick a random plan ID
    v_plan := (ARRAY['free', 'starter', 'pro', 'business'])[floor(random() * 4 + 1)];
    
    -- Insert into auth.users section (unchanged)
    BEGIN
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'testuser_' || floor(extract(epoch from now())) || '_' || i || '@rebal.site',
        crypt('password123', gen_salt('bf')),
        now(),
        'authenticated',
        'authenticated',
        '{"provider":"email","providers":["email"]}',
        '{"name":"Test User ' || i || '"}',
        now() - (random() * interval '90 days'),
        now()
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Insert into companies (unchanged)
    INSERT INTO public.companies (
      id, user_id, name, slug, email, phone, description, tagline, 
      logo_url, hero_image_url, is_verified, created_at,
      primary_color, secondary_color, button_style, font_heading
    ) VALUES (
      v_company_id,
      v_user_id,
      'Test Company ' || i || ' (' || floor(random()*1000) || ')',
      v_company_slug,
      'contact@' || v_company_slug || '.com',
      '+23480' || lpad(floor(random() * 100000000)::text, 8, '0'),
      'This is a generated test company description for testing purposes. We provide excellent real estate services.',
      'Excellence in Real Estate ' || i,
      'https://api.dicebear.com/7.x/initials/svg?seed=' || v_company_slug,
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      (random() > 0.7), -- 30% verified
      now() - (random() * interval '90 days'),
      '#0F172A', '#3B82F6', 'rounded', 'Inter'
    );

    -- Insert Subscription (Corrected column: plan_id)
    INSERT INTO public.subscriptions (
      company_id, plan_id, status, current_period_start, current_period_end, created_at, billing_interval
    ) VALUES (
      v_company_id,
      v_plan,
      (ARRAY['active', 'active', 'active', 'past_due', 'cancelled'])[floor(random() * 5 + 1)],
      now() - interval '15 days',
      now() + interval '15 days',
      now() - interval '90 days',
      (ARRAY['monthly', 'yearly'])[floor(random() * 2 + 1)]::text
    );



      -- Create Properties (Random count based on plan)
      v_property_count := CASE 
        WHEN v_plan = 'free' THEN floor(random() * 2) 
        WHEN v_plan = 'starter' THEN floor(random() * 10) 
        WHEN v_plan = 'pro' THEN floor(random() * 20 + 5) 
        ELSE floor(random() * 30 + 10) 
      END;
  
      FOR j IN 1..v_property_count LOOP
        v_property_id := gen_random_uuid();
        v_status := (ARRAY['Available', 'Available', 'Sold', 'Under Offer'])[floor(random() * 4 + 1)];
        v_promoted := (random() > 0.9); -- 10% boosted
  
        INSERT INTO public.properties (
          id, company_id, title, slug, description, property_type, purpose, 
          price, location, address, state, status, is_active, 
          created_at, priority_score
        ) VALUES (
          v_property_id,
          v_company_id,
          'Test Property ' || j || ' of Company ' || i,
          v_company_slug || '-prop-' || j,
          'Beautiful property description for testing.',
          (ARRAY['Apartment', 'House', 'Land', 'Commercial'])[floor(random() * 4 + 1)],
          (ARRAY['Sale', 'Rent'])[floor(random() * 2 + 1)],
          (floor(random() * 100) + 1) * 1000000,
          'Abuja, Nigeria',
          'Plot ' || j || ' Test Street',
          'FCT',
          v_status,
          true,
          now() - (random() * interval '60 days'),
          CASE WHEN v_promoted THEN 100 ELSE 10 END
        );

      -- Create Inquiries for some properties
      IF random() > 0.5 THEN
        INSERT INTO public.inquiries (
          company_id, property_id, name, email, phone, message, status, created_at
        ) VALUES (
          v_company_id,
          v_property_id,
          'Inquirer ' || j,
          'inquirer' || j || '@example.com',
          '08011112222',
          'Is this still available?',
          'New',
          now() - (random() * interval '10 days')
        );
      END IF;
    END LOOP;

  END LOOP;
  
  RETURN 'Successfully created 30 test users and associated data.';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error seeding data: ' || SQLERRM;
END;
$$;
