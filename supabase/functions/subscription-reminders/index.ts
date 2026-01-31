import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};



const generateReminderEmail = (companyName: string, daysLeft: number, planName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">Subscription Reminder</h1>
  </div>
  
  <div style="padding: 20px;">
    <p style="font-size: 16px;">Hello <strong>${companyName}</strong>,</p>
    
    <p style="font-size: 16px;">Your <strong>${planName}</strong> subscription will expire in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400E;">
        <strong>What happens when it expires:</strong><br>
        • Your property listings will become hidden from public view<br>
        • You'll lose access to premium features<br>
        • Your analytics data will be preserved
      </p>
    </div>
    
    <p style="font-size: 16px;">To continue enjoying uninterrupted service, please renew your subscription before it expires.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://rebal.site/dashboard/settings" 
         style="background: #3B82F6; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        Renew Subscription
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6B7280;">
      If you have any questions, please contact our support team.
    </p>
  </div>
  
  <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 24px; text-align: center; color: #6B7280; font-size: 12px;">
    <p>© 2024 Rebal. All rights reserved.</p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const getEnv = (key: string, required = true): string => {
      const value = Deno.env.get(key);
      if (!value && required) {
        throw new Error(`Missing configuration: ${key}`);
      }
      return value || "";
    };

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = getEnv("RESEND_API_KEY", false);

    // Create client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Running subscription reminder check...");

    // Find subscriptions expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    // Get companies with subscriptions ending in 3 days
    const { data: expiringCompanies, error: fetchError } = await supabase
      .from("companies")
      .select(`
        id, name, email, user_id, subscription_status, subscription_end_date,
        subscriptions!inner(plan_id, status, current_period_end)
      `)
      .eq("subscription_status", "active")
      .gte("subscription_end_date", threeDaysStart.toISOString())
      .lte("subscription_end_date", threeDaysEnd.toISOString());

    if (fetchError) {
      console.error("Error fetching expiring subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringCompanies?.length || 0} subscriptions expiring in 3 days`);

    let emailsSent = 0;
    let notificationsSent = 0;

    for (const company of expiringCompanies || []) {
      const subscription = Array.isArray(company.subscriptions)
        ? company.subscriptions[0]
        : company.subscriptions;

      const planName = subscription?.plan_id || "subscription";

      // Send email if company has email
      if (company.email && resendApiKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Rebal <notifications@resend.dev>",
              to: [company.email],
              subject: `Your ${planName} subscription expires in 3 days`,
              html: generateReminderEmail(company.name, 3, planName),
            }),
          });

          if (emailRes.ok) {
            emailsSent++;
            console.log(`Sent reminder email to ${company.email}`);
          } else {
            console.error(`Failed to send email to ${company.email}:`, await emailRes.text());
          }
        } catch (emailError) {
          console.error(`Failed to send email to ${company.email}:`, emailError);
        }
      }

      // Create in-app notification
      if (company.user_id) {
        await supabase.from("notifications").insert({
          user_id: company.user_id,
          company_id: company.id,
          type: "subscription",
          title: "Subscription Expiring Soon",
          message: `Your ${planName} subscription expires in 3 days. Renew now to avoid service interruption.`,
          metadata: { days_left: 3, plan_id: planName },
        });
        notificationsSent++;
      }
    }

    // Log to admin notifications
    await supabase.from("admin_notifications_log").insert({
      type: "subscription_reminder_batch",
      recipient: "system",
      subject: "Subscription Reminders Sent",
      status: "sent",
      metadata: {
        emails_sent: emailsSent,
        notifications_sent: notificationsSent,
        run_time: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent,
        notifications_sent: notificationsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in subscription-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
