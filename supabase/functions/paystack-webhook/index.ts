import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;

// Grace period configuration (in days)
const GRACE_PERIOD_DAYS = 3;

// Threshold for admin notification on failed payments
const FAILED_PAYMENT_ALERT_THRESHOLD = 2;

// Send admin notification via edge function
async function sendAdminNotification(
  type: string,
  subject: string,
  data: Record<string, unknown>
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        type,
        subject,
        ...data,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Admin Notification] Failed to send:", error);
    } else {
      console.log("[Admin Notification] Sent successfully:", subject);
    }
  } catch (error) {
    console.error("[Admin Notification] Error:", error);
  }
}

// Verify Paystack webhook signature
async function verifyPaystackSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(paystackSecretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBytes = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === computedSignature;
}

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

// Update company subscription status and limits
async function updateCompanySubscription(
  supabase: SupabaseClient,
  companyId: string,
  status: string,
  endDate?: Date,
  maxProperties?: number
) {
  const updateData: Record<string, unknown> = {
    subscription_status: status,
  };

  if (endDate) {
    updateData.subscription_end_date = endDate.toISOString();
  }

  if (maxProperties !== undefined) {
    updateData.max_properties = maxProperties;
  }

  const { error } = await supabase
    .from("companies")
    .update(updateData)
    .eq("id", companyId);

  if (error) {
    console.error(`[Company] Failed to update subscription status:`, error);
  } else {
    console.log(`[Company] Updated ${companyId} to status: ${status}`);
  }
}

// Get plan details
async function getPlanDetails(supabase: SupabaseClient, planId: string) {
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single();
  return data as { max_properties: number; name: string } | null;
}

// Set grace period for failed payment
async function setGracePeriod(
  supabase: SupabaseClient,
  subscriptionCode: string,
  companyId: string
) {
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  // Get current failed payment count
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("failed_payment_count")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  const currentCount = (sub as { failed_payment_count: number } | null)?.failed_payment_count || 0;

  // Update subscription with grace period
  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      grace_period_end: gracePeriodEnd.toISOString(),
      failed_payment_count: currentCount + 1,
    })
    .eq("paystack_subscription_code", subscriptionCode);

  // Update company status
  await updateCompanySubscription(supabase, companyId, "past_due");

  console.log(`[Grace Period] Set for ${subscriptionCode}, ends: ${gracePeriodEnd.toISOString()}`);

  return { gracePeriodEnd, failedCount: currentCount + 1 };
}

// Clear grace period (payment successful)
async function clearGracePeriod(supabase: SupabaseClient, subscriptionCode: string) {
  await supabase
    .from("subscriptions")
    .update({
      grace_period_end: null,
      failed_payment_count: 0,
    })
    .eq("paystack_subscription_code", subscriptionCode);

  console.log(`[Grace Period] Cleared for ${subscriptionCode}`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const signature = req.headers.get("x-paystack-signature");
    const bodyText = await req.text();

    if (!signature) {
      console.error("[Webhook] Missing signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyPaystackSignature(bodyText, signature);
    if (!isValid) {
      console.error("[Webhook] Invalid Paystack signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(bodyText);
    // Log only non-sensitive info - avoid logging full event.data which contains PII
    console.log(`[Webhook] Received event: ${event.event}, Reference: ${event.data?.reference || 'N/A'}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.event) {
      // ============================================
      // CHARGE EVENTS
      // ============================================
      case "charge.success": {
        const { reference, amount, customer, metadata, paid_at, channel } = event.data;
        console.log(`[Charge] Success - Reference: ${reference}, Amount: ${amount}`);

        // Check if already processed to prevent double crediting
        const { data: existingPayment } = await supabase
          .from("payments")
          .select("status")
          .eq("paystack_reference", reference)
          .single();

        if (existingPayment?.status === "success") {
          console.log(`[Webhook] Payment ${reference} already processed, skipping.`);
          break;
        }

        // Update payment record
        // Update payment record ATOMICALLY to prevent race conditions
        const { error: paymentError, data: updatedPayment } = await supabase
          .from("payments")
          .update({
            status: "success",
            paid_at: paid_at,
            payment_method: channel,
          })
          .eq("paystack_reference", reference)
          .neq("status", "success") // ensure we only update if not already success
          .select()
          .single();

        if (paymentError) {
          console.error("[Charge] Failed to update payment:", paymentError);
        }

        // If no payment was updated, it means it was already success (race condition caught)
        if (!updatedPayment) {
          console.log(`[Webhook] Payment ${reference} already processed (Atomic Block). Skipping.`);
          break;
        }

        // If this is a subscription payment, update the subscription and company
        if (metadata?.subscription_id && metadata?.company_id) {
          const now = new Date();
          const periodEnd = new Date();
          const billingInterval = metadata.billing_interval || "monthly";
          periodEnd.setMonth(periodEnd.getMonth() + (billingInterval === "yearly" ? 12 : 1));

          // Get subscription code to clear grace period
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("paystack_subscription_code")
            .eq("id", metadata.subscription_id)
            .single();

          const subscriptionCode = (subData as { paystack_subscription_code: string } | null)?.paystack_subscription_code;

          // Update subscription
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              paystack_customer_code: customer?.customer_code,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              grace_period_end: null,
              failed_payment_count: 0,
            })
            .eq("id", metadata.subscription_id);

          // Get plan details for max_properties
          const plan = await getPlanDetails(supabase, metadata.plan_id || "pro");

          // Update company subscription status
          await updateCompanySubscription(
            supabase,
            metadata.company_id,
            "active",
            periodEnd,
            plan?.max_properties || 999
          );

          // ============================================
          // REFERRAL COMMISSION: 10% on payments ≥ ₦3,000
          // ============================================
          const amountInNaira = amount / 100; // Paystack amounts are in kobo
          const MINIMUM_QUALIFYING_AMOUNT = 3000; // ₦3,000 (Starter plan minimum)
          const REFERRAL_PERCENTAGE = 0.10; // 10%

          if (amountInNaira >= MINIMUM_QUALIFYING_AMOUNT) {
            // Check if this company was referred by someone
            const { data: companyData } = await supabase
              .from("companies")
              .select("referred_by")
              .eq("id", metadata.company_id)
              .single();

            const referrerId = (companyData as { referred_by: string | null } | null)?.referred_by;

            if (referrerId) {
              const commissionAmount = Math.floor(amountInNaira * REFERRAL_PERCENTAGE);
              console.log(`[Referral] Processing commission: ₦${commissionAmount} for referrer ${referrerId}`);

              // Log individual commission transaction
              await supabase
                .from("referral_commissions")
                .insert({
                  referrer_id: referrerId,
                  referred_id: metadata.company_id,
                  payment_amount: amountInNaira,
                  commission_amount: commissionAmount,
                  commission_rate: REFERRAL_PERCENTAGE,
                  payment_reference: reference,
                });

              // Check if referral record exists (created on signup with status=pending, reward=0)
              const { data: existingReferral } = await supabase
                .from("referrals")
                .select("id, reward_amount, status")
                .eq("referrer_id", referrerId)
                .eq("referred_id", metadata.company_id)
                .maybeSingle();

              if (existingReferral) {
                // Update existing referral - add commission and mark as completed
                await supabase
                  .from("referrals")
                  .update({
                    reward_amount: (existingReferral.reward_amount || 0) + commissionAmount,
                    status: "completed",
                  })
                  .eq("id", existingReferral.id);
                console.log(`[Referral] Updated existing referral ${existingReferral.id} with commission ₦${commissionAmount}`);
              } else {
                // Create new referral record (edge case: referred_by set but no referral record)
                await supabase
                  .from("referrals")
                  .insert({
                    referrer_id: referrerId,
                    referred_id: metadata.company_id,
                    reward_amount: commissionAmount,
                    status: "completed",
                  });
                console.log(`[Referral] Created new referral record with commission ₦${commissionAmount}`);
              }

              // Add commission to referrer's wallet balance
              await supabase.rpc("add_to_wallet", {
                p_company_id: referrerId,
                p_amount: commissionAmount,
              });

              // Notify referrer
              const referrerUserId = await getCompanyUserId(supabase, referrerId);
              if (referrerUserId) {
                await createNotification(
                  supabase,
                  referrerUserId,
                  referrerId,
                  "referral",
                  "Referral Commission Earned! 🎉",
                  `You earned ₦${commissionAmount.toLocaleString()} (10%) from a ₦${amountInNaira.toLocaleString()} payment by your referral.`,
                  { amount: commissionAmount, payment_amount: amountInNaira, referred_company_id: metadata.company_id }
                );
              }

              console.log(`[Referral] Commission of ₦${commissionAmount} credited to ${referrerId}`);

              // Notify Admin of Commission
              await sendAdminNotification(
                "referral_commission",
                `Referral Commission Paid: ₦${commissionAmount.toLocaleString()}`,
                {
                  referrer_id: referrerId,
                  referred_id: metadata.company_id,
                  commission_amount: commissionAmount,
                  payment_amount: amountInNaira
                }
              );
            }
          }

          // Notify Admin
          await sendAdminNotification(
            "subscription_paid",
            `New Subscription Payment: ${metadata.plan_name || "Pro"}`,
            {
              company_id: metadata.company_id,
              amount: amount / 100, // Naira
              plan_id: metadata.plan_id,
              reference,
              billing_interval: metadata.billing_interval
            }
          );

          // Send notification
          const userId = await getCompanyUserId(supabase, metadata.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              metadata.company_id,
              "payment",
              "Payment Successful",
              `Your payment of ₦${(amount / 100).toLocaleString()} has been processed. Your subscription is now active.`,
              { reference, amount, plan_id: metadata.plan_id }
            );
          }
        }
        // Handle Domain Payment
        if (metadata?.payment_type === "domain" && metadata?.domain_request_id) {
          console.log(`[Webhook] Processing domain payment for ${metadata.domain_request_id}`);

          // Update domain request status
          await supabase
            .from("domain_requests")
            .update({
              status: "paid",
              paid_at: paid_at,
            })
            .eq("id", metadata.domain_request_id);

          // Notify Admin
          await sendAdminNotification(
            "domain_paid",
            `Domain Payment Received: ${metadata.domain_name}`,
            {
              company_id: metadata.company_id,
              domain_request_id: metadata.domain_request_id,
              amount: amount / 100, // Naira
              domain_name: metadata.domain_name,
            }
          );

          // Notify User
          const userId = await getCompanyUserId(supabase, metadata.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              metadata.company_id,
              "domain",
              "Payment Received!",
              `We received your payment for ${metadata.domain_name}. We will now proceed with registration and setup.`,
              { domain_name: metadata.domain_name, amount: amount / 100 }
            );
          }
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================
      case "subscription.create": {
        const { subscription_code, customer, next_payment_date } = event.data;
        const metadata = event.data.metadata || {};
        console.log(`[Subscription] Created - Code: ${subscription_code}`);

        if (metadata.company_id) {
          // Update subscription record
          await supabase
            .from("subscriptions")
            .update({
              paystack_subscription_code: subscription_code,
              paystack_customer_code: customer?.customer_code,
              current_period_end: next_payment_date,
              status: "active",
              grace_period_end: null,
              failed_payment_count: 0,
            })
            .eq("company_id", metadata.company_id);

          // Update company
          const endDate = next_payment_date ? new Date(next_payment_date) : undefined;
          await updateCompanySubscription(supabase, metadata.company_id, "active", endDate);

          // Send notification
          const userId = await getCompanyUserId(supabase, metadata.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              metadata.company_id,
              "subscription",
              "Subscription Activated",
              `Your subscription has been activated successfully. Next billing date: ${new Date(next_payment_date).toLocaleDateString()}.`,
              { subscription_code, next_payment_date }
            );
          }
        }
        break;
      }

      case "subscription.not_renew": {
        // User chose not to renew (will cancel at period end)
        const { subscription_code, next_payment_date } = event.data;
        console.log(`[Subscription] Not Renewing - Code: ${subscription_code}`);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("company_id")
          .eq("paystack_subscription_code", subscription_code)
          .single();

        const subData = subscription as { company_id: string } | null;
        if (subData?.company_id) {
          // Keep status active until period ends
          await supabase
            .from("subscriptions")
            .update({ status: "cancelling" })
            .eq("paystack_subscription_code", subscription_code);

          const userId = await getCompanyUserId(supabase, subData.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              subData.company_id,
              "subscription",
              "Subscription Cancellation Scheduled",
              `Your subscription will cancel at the end of the current billing period on ${new Date(next_payment_date).toLocaleDateString()}.`,
              { subscription_code }
            );
          }
        }
        break;
      }

      case "subscription.disable": {
        const { subscription_code } = event.data;
        console.log(`[Subscription] Disabled - Code: ${subscription_code}`);

        // Get subscription to find company
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("company_id, plan_id")
          .eq("paystack_subscription_code", subscription_code)
          .single();

        const subData = subscription as { company_id: string; plan_id: string } | null;
        if (subData?.company_id) {
          // Update subscription to cancelled
          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              grace_period_end: null,
              failed_payment_count: 0,
            })
            .eq("paystack_subscription_code", subscription_code);

          // Downgrade company to trial limits
          await updateCompanySubscription(
            supabase,
            subData.company_id,
            "cancelled",
            new Date(), // Set end date to now
            3 // Trial limit
          );

          const userId = await getCompanyUserId(supabase, subData.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              subData.company_id,
              "subscription",
              "Subscription Cancelled",
              "Your subscription has been cancelled. You've been downgraded to the free plan with limited features.",
              { subscription_code }
            );
          }
        }
        break;
      }

      case "subscription.expiring_cards": {
        // Card expiring soon
        const { subscription_code, email } = event.data;
        console.log(`[Subscription] Card Expiring - Code: ${subscription_code}`);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("company_id")
          .eq("paystack_subscription_code", subscription_code)
          .single();

        const subData = subscription as { company_id: string } | null;
        if (subData?.company_id) {
          const userId = await getCompanyUserId(supabase, subData.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              subData.company_id,
              "billing",
              "Card Expiring Soon",
              "Your payment card is expiring soon. Please update your payment method to avoid service interruption.",
              { subscription_code, email }
            );
          }
        }
        break;
      }

      // ============================================
      // INVOICE EVENTS
      // ============================================
      case "invoice.create": {
        const { subscription } = event.data;
        console.log(`[Invoice] Created - Subscription: ${subscription?.subscription_code}`);
        // Just log - no action needed yet
        break;
      }

      case "invoice.update": {
        const { subscription, paid, amount } = event.data;
        console.log(`[Invoice] Updated - Subscription: ${subscription?.subscription_code}, Paid: ${paid}`);

        if (paid && subscription?.subscription_code) {
          // Invoice was paid - this is a renewal, clear grace period
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("company_id, billing_interval, plan_id")
            .eq("paystack_subscription_code", subscription.subscription_code)
            .single();

          const subData = sub as { company_id: string; billing_interval: string; plan_id: string } | null;
          if (subData?.company_id) {
            const now = new Date();
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + (subData.billing_interval === "yearly" ? 12 : 1));

            // Update subscription period and clear grace period
            await supabase
              .from("subscriptions")
              .update({
                status: "active",
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                grace_period_end: null,
                failed_payment_count: 0,
              })
              .eq("paystack_subscription_code", subscription.subscription_code);

            // Update company
            await updateCompanySubscription(supabase, subData.company_id, "active", periodEnd);

            const userId = await getCompanyUserId(supabase, subData.company_id);
            if (userId) {
              await createNotification(
                supabase,
                userId,
                subData.company_id,
                "payment",
                "Subscription Renewed",
                `Your subscription has been renewed. Amount: ₦${(amount / 100).toLocaleString()}.`,
                { amount }
              );
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const { subscription } = event.data;
        console.log(`[Invoice] Payment Failed - Subscription: ${subscription?.subscription_code}`);

        if (subscription?.subscription_code) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("company_id")
            .eq("paystack_subscription_code", subscription.subscription_code)
            .single();

          const subData = sub as { company_id: string } | null;
          if (subData?.company_id) {
            // Set grace period
            const { gracePeriodEnd, failedCount } = await setGracePeriod(
              supabase,
              subscription.subscription_code,
              subData.company_id
            );

            const userId = await getCompanyUserId(supabase, subData.company_id);
            if (userId) {
              await createNotification(
                supabase,
                userId,
                subData.company_id,
                "billing",
                "Payment Failed",
                `Your subscription payment failed. Please update your payment method by ${gracePeriodEnd.toLocaleDateString()} to avoid service interruption.`,
                { subscription_code: subscription.subscription_code, grace_period_end: gracePeriodEnd.toISOString() }
              );
            }

            // Send admin alert if threshold reached
            if (failedCount >= FAILED_PAYMENT_ALERT_THRESHOLD) {
              await sendAdminNotification(
                "payment_alert",
                `Multiple Payment Failures: ${subData.company_id}`,
                {
                  company_id: subData.company_id,
                  failed_count: failedCount,
                  subscription_code: subscription.subscription_code,
                }
              );
            }
          }
        }
        break;
      }

      // ============================================
      // REFUND EVENTS
      // ============================================
      case "refund.processed": {
        const { transaction_reference, amount } = event.data;
        console.log(`[Refund] Processed - Reference: ${transaction_reference}, Amount: ${amount}`);

        // Update payment status
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("paystack_reference", transaction_reference);

        // Get payment to find company
        const { data: payment } = await supabase
          .from("payments")
          .select("company_id")
          .eq("paystack_reference", transaction_reference)
          .single();

        const paymentData = payment as { company_id: string } | null;
        if (paymentData?.company_id) {
          const userId = await getCompanyUserId(supabase, paymentData.company_id);
          if (userId) {
            await createNotification(
              supabase,
              userId,
              paymentData.company_id,
              "payment",
              "Refund Processed",
              `A refund of ₦${(amount / 100).toLocaleString()} has been processed to your account.`,
              { transaction_reference, amount }
            );
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
