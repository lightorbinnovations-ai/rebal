CREATE OR REPLACE FUNCTION public.seed_database_data()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Variables for random weighting
  v_rand_weight float;
  
  -- Location variables
  v_city text;
  v_state text;
  v_loc_index int;
  v_locations text[][] := ARRAY[
    ['Lagos', 'Lagos'], 
    ['Ikeja', 'Lagos'],
    ['Lekki', 'Lagos'],
    ['Abuja', 'FCT'], 
    ['Maitama', 'FCT'],
    ['Port Harcourt', 'Rivers'], 
    ['Ibadan', 'Oyo'], 
    ['Enugu', 'Enugu'], 
    ['Kano', 'Kano'],
    ['Asaba', 'Delta'],
    ['Uyo', 'Akwa Ibom']
  ];
BEGIN
  -- Insert/Ensure Plans Exist
  INSERT INTO public.subscription_plans (id, name, description, monthly_price, yearly_price, features, max_properties, is_active)
  VALUES 
    ('free', 'Free Plan', 'Basic features', 0, 0, '["1 property listing", "Basic analytics"]', 1, true),
    ('starter', 'Starter Plan', 'For individual agents', 500000, 5000000, '["10 listings", "Standard support"]', 10, true),
    ('pro', 'Pro Plan', 'For small agencies', 1500000, 15000000, '["50 listings", "Priority support", "Branding"]', 50, true),
    ('business', 'Business Plan', 'For large agencies', 5000000, 50000000, '["Unlimited listings", "Dedicated support", "API Access"]', 9999, true)
  ON CONFLICT (id) DO NOTHING;

  -- Create 30 Users
  FOR i IN 1..30 LOOP
    v_user_id := gen_random_uuid();
    v_company_id := gen_random_uuid();
    v_company_slug := 'test-company-' || floor(extract(epoch from now())) || '-' || i;
    
    -- WEIGHTED PLAN SELECTION
    -- 0.0 - 0.5 (50%) -> Free
    -- 0.5 - 0.8 (30%) -> Starter
    -- 0.8 - 0.95 (15%) -> Pro
    -- 0.95 - 1.0 (5%) -> Business (Very rare)
    v_rand_weight := random();
    
    IF v_rand_weight < 0.5 THEN
      v_plan := 'free';
    ELSIF v_rand_weight < 0.8 THEN
      v_plan := 'starter';
    ELSIF v_rand_weight < 0.95 THEN
      v_plan := 'pro';
    ELSE
      v_plan := 'business';
    END IF;
    
    -- Insert Auth User (Mock)
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

    -- Insert Company
    -- Pick random location for base company address
    v_loc_index := floor(random() * array_length(v_locations, 1) + 1);
    v_city := v_locations[v_loc_index][1];
    v_state := v_locations[v_loc_index][2];

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
      'Premier real estate services in ' || v_city || '. We find the best properties for you.',
      'Real Estate in ' || v_city,
      'https://api.dicebear.com/7.x/initials/svg?seed=' || v_company_slug,
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      (random() > 0.8), -- Only 20% verified now
      now() - (random() * interval '90 days'),
      '#0F172A', '#3B82F6', 'rounded', 'Inter'
    );

    -- Insert Subscription
    INSERT INTO public.subscriptions (
      company_id, plan_id, status, current_period_start, current_period_end, created_at, billing_interval
    ) VALUES (
      v_company_id,
      v_plan,
      'active',
      now() - interval '10 days',
      now() + interval '20 days',
      now() - interval '40 days',
      'monthly'
    );

    -- Create Properties (Count based on plan)
    v_property_count := CASE 
      WHEN v_plan = 'free' THEN 1
      WHEN v_plan = 'starter' THEN floor(random() * 5 + 1)::int
      WHEN v_plan = 'pro' THEN floor(random() * 10 + 5)::int
      ELSE floor(random() * 15 + 10)::int
    END;

    FOR j IN 1..v_property_count LOOP
      v_property_id := gen_random_uuid();
      
      -- Pick random location for each property (can differ from company base)
      v_loc_index := floor(random() * array_length(v_locations, 1) + 1);
      v_city := v_locations[v_loc_index][1];
      v_state := v_locations[v_loc_index][2];
      
      v_status := (ARRAY['Available', 'Available', 'Available', 'Sold', 'Under Offer'])[floor(random() * 5 + 1)];
      v_promoted := (random() > 0.95); -- Only 5% boosted

      INSERT INTO public.properties (
        id, company_id, title, slug, description, property_type, purpose, 
        price, location, address, state, status, is_active, 
        created_at, priority_score
      ) VALUES (
        v_property_id,
        v_company_id,
        (ARRAY['Modern Apartment', 'Luxury Villa', 'Cozy Studio', 'Office Space', 'Prime Land'])[floor(random()*5+1)] || ' in ' || v_city,
        v_company_slug || '-prop-' || j,
        'Excellent opportunity in ' || v_city || '. Great neighborhood and amenities.',
        (ARRAY['Apartment', 'House', 'Land', 'Commercial'])[floor(random() * 4 + 1)],
        (ARRAY['Sale', 'Rent'])[floor(random() * 2 + 1)],
        (floor(random() * 100) + 5) * 1000000,
        v_city || ', Nigeria',
        'Plot ' || floor(random()*500) || ' ' || v_city || ' Road',
        v_state,
        v_status,
        true,
        now() - (random() * interval '60 days'),
        CASE WHEN v_promoted THEN 100 ELSE 10 END
      );
    END LOOP;
  END LOOP;
  
  RETURN 'Seeded 30 users with REALISTIC weighted distribution (Few Business, Many Free/Starter) & Diverse Locations.';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error seeding data: ' || SQLERRM;
END;
$function$
