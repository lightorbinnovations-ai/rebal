import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test data configurations
const companyData = [
  // FREE TIER (10 companies - 1 property each)
  { name: "Lagos Prime Realty", slug: "lagos-prime-realty", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Abuja Homes Direct", slug: "abuja-homes-direct", tier: "free", propertyCount: 1, hasReferrer: true },
  { name: "Port Harcourt Properties", slug: "port-harcourt-properties", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Kano Real Estate Hub", slug: "kano-real-estate-hub", tier: "free", propertyCount: 1, hasReferrer: true },
  { name: "Ibadan Property Finders", slug: "ibadan-property-finders", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Enugu Home Solutions", slug: "enugu-home-solutions", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Kaduna Property Express", slug: "kaduna-property-express", tier: "free", propertyCount: 1, hasReferrer: true },
  { name: "Benin City Realtors", slug: "benin-city-realtors", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Jos Highland Properties", slug: "jos-highland-properties", tier: "free", propertyCount: 1, hasReferrer: false },
  { name: "Calabar Coastal Homes", slug: "calabar-coastal-homes", tier: "free", propertyCount: 1, hasReferrer: true },

  // STARTER TIER (8 companies - up to 10 properties each)
  { name: "Victoria Island Luxury Homes", slug: "victoria-island-luxury", tier: "starter", propertyCount: 5, hasReferrer: false },
  { name: "Lekki Phase 1 Properties", slug: "lekki-phase-1-properties", tier: "starter", propertyCount: 8, hasReferrer: true },
  { name: "Ikoyi Premium Estates", slug: "ikoyi-premium-estates", tier: "starter", propertyCount: 6, hasReferrer: false },
  { name: "Maitama Elite Realty", slug: "maitama-elite-realty", tier: "starter", propertyCount: 4, hasReferrer: true },
  { name: "Asokoro Prime Properties", slug: "asokoro-prime-properties", tier: "starter", propertyCount: 7, hasReferrer: false },
  { name: "GRA Ikeja Homes", slug: "gra-ikeja-homes", tier: "starter", propertyCount: 3, hasReferrer: false },
  { name: "Surulere Property Hub", slug: "surulere-property-hub", tier: "starter", propertyCount: 9, hasReferrer: true },
  { name: "Yaba Tech District Realty", slug: "yaba-tech-district", tier: "starter", propertyCount: 5, hasReferrer: false },

  // PRO TIER (7 companies - up to 50 properties each)
  { name: "Nigeria Property Masters", slug: "nigeria-property-masters", tier: "pro", propertyCount: 12, hasReferrer: false },
  { name: "African Real Estate Group", slug: "african-real-estate-group", tier: "pro", propertyCount: 15, hasReferrer: true },
  { name: "West African Properties Ltd", slug: "west-african-properties", tier: "pro", propertyCount: 10, hasReferrer: false },
  { name: "Naija Homes International", slug: "naija-homes-international", tier: "pro", propertyCount: 8, hasReferrer: true },
  { name: "Premium Nigerian Estates", slug: "premium-nigerian-estates", tier: "pro", propertyCount: 11, hasReferrer: false },
  { name: "Royal Niger Properties", slug: "royal-niger-properties", tier: "pro", propertyCount: 6, hasReferrer: false },
  { name: "Afropolitan Real Estate", slug: "afropolitan-real-estate", tier: "pro", propertyCount: 9, hasReferrer: true },

  // BUSINESS TIER (5 companies - unlimited properties)
  { name: "Elite Nigerian Developers", slug: "elite-nigerian-developers", tier: "business", propertyCount: 20, hasReferrer: false },
  { name: "Pan-African Property Corp", slug: "pan-african-property", tier: "business", propertyCount: 18, hasReferrer: true },
  { name: "Continental Estates Nigeria", slug: "continental-estates", tier: "business", propertyCount: 15, hasReferrer: false },
  { name: "Grand Nigerian Properties", slug: "grand-nigerian-properties", tier: "business", propertyCount: 12, hasReferrer: true },
  { name: "Mega Realty Solutions", slug: "mega-realty-solutions", tier: "business", propertyCount: 16, hasReferrer: false },
];

const propertyTypes = ["Apartment", "House", "Duplex", "Bungalow", "Penthouse", "Villa", "Maisonette", "Terraced House", "Semi-Detached", "Commercial"];
const purposes = ["For Sale", "For Rent", "Short Let"];
const statuses = ["Available", "Sold", "Reserved", "Under Offer"];
const states = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Enugu", "Kaduna", "Edo", "Plateau", "Cross River"];
const cities: Record<string, string[]> = {
  "Lagos": ["Lekki", "Victoria Island", "Ikoyi", "Ikeja", "Surulere", "Yaba", "Ajah", "Gbagada"],
  "Abuja": ["Maitama", "Asokoro", "Wuse", "Garki", "Gwarinpa", "Jabi", "Utako"],
  "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Bonny"],
  "Kano": ["Kano Municipal", "Nassarawa", "Tarauni"],
  "Oyo": ["Ibadan North", "Ibadan South", "Ogbomoso"],
  "Enugu": ["Enugu North", "Enugu South", "Nsukka"],
  "Kaduna": ["Kaduna North", "Kaduna South", "Zaria"],
  "Edo": ["Benin City", "Oredo", "Egor"],
  "Plateau": ["Jos North", "Jos South", "Bukuru"],
  "Cross River": ["Calabar", "Calabar South", "Akamkpa"]
};

const features = [
  "Swimming Pool", "Gym", "24/7 Security", "CCTV", "Parking Space", "Generator", 
  "Borehole", "Boys Quarter", "Smart Home", "Solar Panel", "Garden", "Balcony",
  "Walk-in Closet", "En-suite Bathroom", "Kitchen Island", "Laundry Room"
];

const taglines = [
  "Your Trusted Property Partner",
  "Finding Your Dream Home",
  "Excellence in Real Estate",
  "Where Quality Meets Location",
  "Premium Properties, Premium Service",
  "Your Gateway to Nigerian Real Estate",
  "Building Dreams, Creating Homes",
  "Real Estate Redefined",
  "Your Property, Our Priority",
  "Exceptional Homes for Exceptional People"
];

const descriptions = [
  "We are a leading real estate company committed to providing exceptional property solutions across Nigeria.",
  "With years of experience in the Nigerian property market, we help clients find their perfect home.",
  "Our team of experts is dedicated to delivering outstanding real estate services with integrity.",
  "We specialize in premium properties in Nigeria's most sought-after locations.",
  "Your satisfaction is our priority. We go above and beyond to meet your real estate needs.",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomFeatures(count: number): string[] {
  const shuffled = [...features].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePrice(type: string, purpose: string): number {
  const basePrices: Record<string, number> = {
    "Apartment": 25000000,
    "House": 45000000,
    "Duplex": 65000000,
    "Bungalow": 35000000,
    "Penthouse": 120000000,
    "Villa": 150000000,
    "Maisonette": 55000000,
    "Terraced House": 40000000,
    "Semi-Detached": 50000000,
    "Commercial": 80000000
  };
  
  let price = basePrices[type] || 30000000;
  price = price * (0.7 + Math.random() * 0.6); // Add variance
  
  if (purpose === "For Rent") {
    price = Math.floor(price / 120); // Monthly rent
  } else if (purpose === "Short Let") {
    price = Math.floor(price / 3600); // Daily rate
  }
  
  return Math.round(price / 100000) * 100000; // Round to nearest 100k
}

function generatePropertyTitle(type: string, bedrooms: number, city: string): string {
  const adjectives = ["Luxurious", "Modern", "Elegant", "Spacious", "Beautiful", "Stunning", "Exquisite", "Contemporary"];
  return `${getRandomElement(adjectives)} ${bedrooms} Bedroom ${type} in ${city}`;
}

function generatePropertyDescription(type: string, bedrooms: number, features: string[]): string {
  return `This stunning ${bedrooms} bedroom ${type.toLowerCase()} offers modern living at its finest. Features include ${features.slice(0, 4).join(", ")}. Perfect for families looking for comfort and style in a prime location. The property boasts excellent finishing and attention to detail throughout.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { adminEmail, adminPassword } = await req.json();

    if (!adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ error: "Admin email and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      usersCreated: 0,
      companiesCreated: 0,
      propertiesCreated: 0,
      subscriptionsCreated: 0,
      referralsCreated: 0,
      errors: [] as string[],
    };

    // Step 1: Create or verify admin user
    let adminUserId: string;
    
    const { data: existingAdmin } = await supabase.auth.admin.listUsers();
    const adminUser = existingAdmin?.users?.find(u => u.email === adminEmail);
    
    if (adminUser) {
      adminUserId = adminUser.id;
      console.log("Admin user exists:", adminUserId);
    } else {
      const { data: newAdmin, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      
      if (adminError) {
        results.errors.push(`Failed to create admin: ${adminError.message}`);
        return new Response(
          JSON.stringify({ error: "Failed to create admin user", details: adminError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      adminUserId = newAdmin.user!.id;
      results.usersCreated++;
    }

    // Step 2: Ensure admin has super_admin role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", adminUserId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: adminUserId, role: "super_admin" });
      
      if (roleError) {
        results.errors.push(`Failed to assign admin role: ${roleError.message}`);
      }
    }

    // Step 3: Create test users and companies
    const createdCompanies: { id: string; slug: string; tier: string }[] = [];
    
    for (let i = 0; i < companyData.length; i++) {
      const company = companyData[i];
      const email = `test.agent${i + 1}@rebal-test.com`;
      const password = `TestAgent${i + 1}@2024`;
      
      // Create user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError) {
        results.errors.push(`Failed to create user ${email}: ${userError.message}`);
        continue;
      }

      results.usersCreated++;
      const userId = userData.user!.id;

      // Determine subscription dates based on tier
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      let subscriptionStatus = "trialing";
      let maxProperties = 1;
      let planId = "free";
      
      switch (company.tier) {
        case "starter":
          subscriptionStatus = "active";
          maxProperties = 10;
          planId = "starter";
          break;
        case "pro":
          subscriptionStatus = "active";
          maxProperties = 50;
          planId = "pro";
          break;
        case "business":
          subscriptionStatus = "active";
          maxProperties = 999;
          planId = "business";
          break;
        default:
          subscriptionStatus = "trialing";
          maxProperties = 1;
          planId = "free";
      }

      const state = getRandomElement(states);
      const city = getRandomElement(cities[state] || ["City Center"]);

      // Create company
      const { data: companyResult, error: companyError } = await supabase
        .from("companies")
        .insert({
          user_id: userId,
          name: company.name,
          slug: company.slug,
          tagline: getRandomElement(taglines),
          description: getRandomElement(descriptions),
          email: email,
          phone: `+234${Math.floor(7000000000 + Math.random() * 999999999)}`,
          address: `${Math.floor(1 + Math.random() * 200)} ${city} Street, ${state}`,
          whatsapp: `+234${Math.floor(7000000000 + Math.random() * 999999999)}`,
          subscription_status: subscriptionStatus,
          subscription_end_date: endDate.toISOString(),
          max_properties: maxProperties,
          is_verified: Math.random() > 0.5,
          primary_color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
          secondary_color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        })
        .select()
        .single();

      if (companyError) {
        results.errors.push(`Failed to create company ${company.name}: ${companyError.message}`);
        continue;
      }

      results.companiesCreated++;
      createdCompanies.push({ id: companyResult.id, slug: company.slug, tier: company.tier });

      // Create subscription record for paid tiers
      if (company.tier !== "free") {
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert({
            company_id: companyResult.id,
            plan_id: planId,
            status: "active",
            billing_interval: "monthly",
            current_period_start: now.toISOString(),
            current_period_end: endDate.toISOString(),
          });

        if (subError) {
          results.errors.push(`Failed to create subscription for ${company.name}: ${subError.message}`);
        } else {
          results.subscriptionsCreated++;
        }
      }

      // Create properties for this company
      for (let j = 0; j < company.propertyCount; j++) {
        const propState = getRandomElement(states);
        const propCity = getRandomElement(cities[propState] || ["City Center"]);
        const propType = getRandomElement(propertyTypes);
        const propPurpose = getRandomElement(purposes);
        const bedrooms = Math.floor(1 + Math.random() * 5);
        const propFeatures = getRandomFeatures(Math.floor(3 + Math.random() * 6));
        
        const propertySlug = `${propType.toLowerCase().replace(/\s+/g, '-')}-${bedrooms}bed-${propCity.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${j}`;

        const { error: propError } = await supabase
          .from("properties")
          .insert({
            company_id: companyResult.id,
            title: generatePropertyTitle(propType, bedrooms, propCity),
            slug: propertySlug,
            description: generatePropertyDescription(propType, bedrooms, propFeatures),
            property_type: propType,
            purpose: propPurpose,
            price: generatePrice(propType, propPurpose),
            state: propState,
            city: propCity,
            address: `${Math.floor(1 + Math.random() * 500)} ${propCity} Road, ${propState}`,
            features: propFeatures,
            status: getRandomElement(statuses),
            is_active: true,
            priority_score: company.tier === "business" ? 4 : company.tier === "pro" ? 3 : company.tier === "starter" ? 2 : 1,
          });

        if (propError) {
          results.errors.push(`Failed to create property for ${company.name}: ${propError.message}`);
        } else {
          results.propertiesCreated++;
        }
      }
    }

    // Step 4: Create referral relationships
    const companiesWithReferrers = companyData.filter(c => c.hasReferrer);
    const potentialReferrers = createdCompanies.filter(c => 
      c.tier === "starter" || c.tier === "pro" || c.tier === "business"
    );

    for (const company of companiesWithReferrers) {
      const referredCompany = createdCompanies.find(c => c.slug === company.slug);
      if (!referredCompany || potentialReferrers.length === 0) continue;

      const referrer = getRandomElement(potentialReferrers);
      if (referrer.id === referredCompany.id) continue;

      // Update company with referrer
      await supabase
        .from("companies")
        .update({ referred_by: referrer.id })
        .eq("id", referredCompany.id);

      // Create referral record
      const { error: refError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrer.id,
          referred_id: referredCompany.id,
          status: company.tier !== "free" ? "completed" : "pending",
          reward_amount: company.tier !== "free" ? 300 : 0,
        });

      if (!refError) {
        results.referralsCreated++;
      }
    }

    // Step 5: Create some inquiries for testing
    for (let i = 0; i < 20; i++) {
      const randomCompany = getRandomElement(createdCompanies);
      
      await supabase
        .from("inquiries")
        .insert({
          company_id: randomCompany.id,
          name: `Test Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`,
          phone: `+234${Math.floor(7000000000 + Math.random() * 999999999)}`,
          message: `I am interested in your properties. Please contact me for more information.`,
          status: getRandomElement(["New", "Viewed", "Responded"]),
        });
    }

    // Step 6: Create test credentials summary
    const testCredentials = companyData.map((c, i) => ({
      email: `test.agent${i + 1}@rebal-test.com`,
      password: `TestAgent${i + 1}@2024`,
      company: c.name,
      tier: c.tier,
      propertyCount: c.propertyCount,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        results,
        adminCredentials: {
          email: adminEmail,
          password: "***hidden***",
        },
        testCredentials,
        summary: {
          totalCompanies: results.companiesCreated,
          totalProperties: results.propertiesCreated,
          byTier: {
            free: companyData.filter(c => c.tier === "free").length,
            starter: companyData.filter(c => c.tier === "starter").length,
            pro: companyData.filter(c => c.tier === "pro").length,
            business: companyData.filter(c => c.tier === "business").length,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
