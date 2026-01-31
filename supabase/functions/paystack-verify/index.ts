import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Referral commission configuration
const MINIMUM_QUALIFYING_AMOUNT = 3000; // ₦3,000 (Starter plan minimum)
const REFERRAL_PERCENTAGE = 0.10; // 10%

// Get company user ID for notifications
async function getCompanyUserId(supabase: SupabaseClient, companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from("companies")
    .select("user_id")
    .eq("id", companyId)
    .single();
  return (data as { user_id: string } | null)?.user_id || null;
}

// Create notification for user
async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      company_id: companyId,
      type,
      title,
      message,
      metadata: metadata || {},
    });
    console.log(`[Notification] Created: ${title}`);
  } catch (error) {
    console.error("[Notification] Failed to create:", error);
  }
}

// Process referral commission
async function processReferralCommission(
  supabase: SupabaseClient,
  companyId: string,
  amountInNaira: number,
  paymentReference: string
): Promise<{ processed: boolean; referrerId?: string; commissionAmount?: number }> {
  // Check if amount qualifies for commission
  if (amountInNaira < MINIMUM_QUALIFYING_AMOUNT) {
    console.log(`[Referral] Amount ₦${amountInNaira} below minimum ₦${MINIMUM_QUALIFYING_AMOUNT}, skipping commission`);
    return { processed: false };
  }

  // Check if this company was referred by someone
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .select("referred_by, name")
    .eq("id", companyId)
    .single();

  if (companyError) {
    console.error("[Referral] Error fetching company:", companyError);
    return { processed: false };
  }

  const referrerId = (companyData as { referred_by: string | null; name: string } | null)?.referred_by;
  const referredName = (companyData as { referred_by: string | null; name: string } | null)?.name || "Unknown";

  if (!referrerId) {
    console.log(`[Referral] Company ${companyId} has no referrer, skipping commission`);
    return { processed: false };
  }

  const commissionAmount = Math.floor(amountInNaira * REFERRAL_PERCENTAGE);
  console.log(`[Referral] Processing commission: ₦${commissionAmount} for referrer ${referrerId} (from ${referredName})`);

  // Log individual commission transaction
  const { error: commissionError } = await supabase
    .from("referral_commissions")
    .insert({
      referrer_id: referrerId,
      referred_id: companyId,
      payment_amount: amountInNaira,
      commission_amount: commissionAmount,
      commission_rate: REFERRAL_PERCENTAGE,
      payment_reference: paymentReference,
    });

  if (commissionError) {
    console.error("[Referral] Error inserting commission:", commissionError);
    return { processed: false };
  }

  // Check if referral record exists (created on signup with status=pending, reward=0)
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id, reward_amount, status")
    .eq("referrer_id", referrerId)
    .eq("referred_id", companyId)
    .maybeSingle();

  if (existingReferral) {
    // Update existing referral - add commission and mark as completed
    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        reward_amount: (existingReferral.reward_amount || 0) + commissionAmount,
        status: "completed",
      })
      .eq("id", existingReferral.id);

    if (updateError) {
      console.error("[Referral] Error updating referral:", updateError);
    } else {
      console.log(`[Referral] Updated existing referral ${existingReferral.id} with commission ₦${commissionAmount}`);
    }
  } else {
    // Create new referral record (edge case: referred_by set but no referral record)
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: companyId,
        reward_amount: commissionAmount,
        status: "completed",
      });

    if (insertError) {
      console.error("[Referral] Error creating referral record:", insertError);
    } else {
      console.log(`[Referral] Created new referral record with commission ₦${commissionAmount}`);
    }
  }

  // Add commission to referrer's wallet balance
  const { error: walletError } = await supabase.rpc("add_to_wallet", {
    p_company_id: referrerId,
    p_amount: commissionAmount,
  });

  if (walletError) {
    console.error("[Referral] Error updating wallet:", walletError);
  } else {
    console.log(`[Referral] Added ₦${commissionAmount} to wallet of ${referrerId}`);
  }

  // Notify referrer
  const referrerUserId = await getCompanyUserId(supabase, referrerId);
  if (referrerUserId) {
    await createNotification(
      supabase,
      referrerUserId,
      referrerId,
      "referral",
      "Referral Commission Earned! 🎉",
      `You earned ₦${commissionAmount.toLocaleString()} (10%) from a ₦${amountInNaira.toLocaleString()} payment by ${referredName}.`,
      { amount: commissionAmount, payment_amount: amountInNaira, referred_company_id: companyId }
    );
  }

  console.log(`[Referral] Commission of ₦${commissionAmount} credited to ${referrerId}`);
  return { processed: true, referrerId, commissionAmount };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const getEnv = (key: string, required = true): string => {
      const value = Deno.env.get(key);
      if (!value && required) {
        console.error(`[CRITICAL] Missing environment variable: ${key}`);
        throw new Error(`Missing configuration: ${key}`);
      }
      return value || "";
    };

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const paystackSecretKey = getEnv("PAYSTACK_SECRET_KEY");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get reference (support both GET query param and POST JSON body)
    const url = new URL(req.url);
    let reference = url.searchParams.get("reference");

    if (!reference && req.method === "POST") {
      try {
        const body = await req.json();
        reference = body?.reference;
      } catch {
        // ignore parse errors; will be handled by missing reference check below
      }
    }

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ error: paystackData.message || "Verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = paystackData.data;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this payment was already processed to prevent double commission
    const { data: existingPayment } = await adminSupabase
      .from("payments")
      .select("id, status")
      .eq("paystack_reference", reference)
      .single();

    const alreadyProcessed = existingPayment?.status === "success";

    // Update payment record
    await adminSupabase
      .from("payments")
      .update({
        status: transaction.status === "success" ? "success" : "failed",
        paid_at: transaction.paid_at,
        payment_method: transaction.channel,
      })
      .eq("paystack_reference", reference);

    // If successful, update the appropriate record based on payment type
    if (transaction.status === "success") {
      const paymentType = transaction.metadata?.payment_type;

      // Handle Domain Payment
      if (paymentType === "domain" && transaction.metadata?.domain_request_id) {
        const domainRequestId = transaction.metadata.domain_request_id;

        // Update domain request status to paid
        await adminSupabase
          .from("domain_requests")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_reference: reference,
          })
          .eq("id", domainRequestId);

        // Notify user
        const companyId = transaction.metadata.company_id;
        const userId = await getCompanyUserId(adminSupabase, companyId);
        if (userId) {
          await createNotification(
            adminSupabase,
            userId,
            companyId,
            "domain",
            "Domain Payment Received! 🎉",
            `We've received your payment for ${transaction.metadata.domain_name}. We'll start setting up your domain shortly.`,
            { domain_request_id: domainRequestId, domain_name: transaction.metadata.domain_name }
          );
        }

        // Log admin notification (fire and forget)
        try {
          await adminSupabase
            .from("admin_notifications_log")
            .insert({
              type: "domain",
              subject: `Domain payment received: ${transaction.metadata.domain_name}`,
              recipient: "admin",
              status: "pending",
              metadata: { domain_request_id: domainRequestId, amount: transaction.amount / 100 },
            });
        } catch (logError) {
          console.error("Failed to log admin notification:", logError);
        }

        console.log("[Paystack] Domain payment verified:", reference);

        return new Response(
          JSON.stringify({
            success: true,
            status: transaction.status,
            amount: transaction.amount / 100,
            payment_type: "domain",
            domain_name: transaction.metadata.domain_name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle Subscription Payment
      if (transaction.metadata?.subscription_id) {
        const now = new Date();
        const periodEnd = new Date();
        const billingInterval = transaction.metadata.billing_interval || "monthly";
        periodEnd.setMonth(periodEnd.getMonth() + (billingInterval === "yearly" ? 12 : 1));

        // Update subscription
        await adminSupabase
          .from("subscriptions")
          .update({
            status: "active",
            plan_id: transaction.metadata.plan_id,
            paystack_customer_code: transaction.customer?.customer_code,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", transaction.metadata.subscription_id);

        // Get plan for max_properties
        const { data: plan } = await adminSupabase
          .from("subscription_plans")
          .select("max_properties")
          .eq("id", transaction.metadata.plan_id)
          .single();

        // Update company subscription status
        await adminSupabase
          .from("companies")
          .update({
            subscription_status: "active",
            subscription_end_date: periodEnd.toISOString(),
            max_properties: plan?.max_properties || 999,
          })
          .eq("id", transaction.metadata.company_id);

        console.log("[Paystack] Payment verified and subscription activated:", reference);

        // ============================================
        // REFERRAL COMMISSION PROCESSING
        // Only process if this is a new successful payment (not already processed)
        // ============================================
        if (!alreadyProcessed && transaction.metadata?.company_id) {
          const amountInNaira = transaction.amount / 100; // Paystack uses kobo
          const { processed, commissionAmount, referrerId } = await processReferralCommission(
            adminSupabase,
            transaction.metadata.company_id,
            amountInNaira,
            reference
          );

          if (processed) {
            console.log(`[Paystack] Referral commission ₦${commissionAmount} credited to ${referrerId}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: transaction.status === "success",
        status: transaction.status,
        amount: transaction.amount / 100,
        plan: transaction.metadata?.plan_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
