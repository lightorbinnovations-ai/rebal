import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  type: "failed_payment_alert" | "grace_period_expiring" | "subscription_cancelled" | "high_churn_alert";
  subject: string;
  companyName?: string;
  companyId?: string;
  amount?: number;
  failedCount?: number;
  gracePeriodEnd?: string;
  additionalDetails?: Record<string, unknown>;
}

const ADMIN_EMAIL = "rebalpros@gmail.com";

const getEmailTemplate = (data: AdminNotificationRequest): string => {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  switch (data.type) {
    case "failed_payment_alert":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ Failed Payment Alert</h1>
          <p>A company has experienced multiple failed payment attempts:</p>
          <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Company</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.companyName || "Unknown"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Failed Attempts</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626;">${data.failedCount || 0}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Amount</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">₦${(data.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Grace Period Ends</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.gracePeriodEnd || "N/A"}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Rebal admin dashboard.</p>
        </div>
      `;

    case "grace_period_expiring":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #f59e0b; margin-bottom: 20px;">⏰ Grace Period Expiring Soon</h1>
          <p>A subscription's grace period is about to expire:</p>
          <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Company</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.companyName || "Unknown"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Grace Period Ends</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; color: #f59e0b;">${data.gracePeriodEnd || "N/A"}</td>
            </tr>
          </table>
          <p>If payment is not received, the subscription will be downgraded automatically.</p>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Rebal admin dashboard.</p>
        </div>
      `;

    case "subscription_cancelled":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #6b7280; margin-bottom: 20px;">❌ Subscription Cancelled</h1>
          <p>A subscription has been cancelled due to payment failure:</p>
          <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Company</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.companyName || "Unknown"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Reason</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Grace period expired</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Rebal admin dashboard.</p>
        </div>
      `;

    case "high_churn_alert":
      return `
        <div style="${baseStyles}">
          <h1 style="color: #dc2626; margin-bottom: 20px;">📉 High Churn Alert</h1>
          <p>Multiple subscriptions have been cancelled recently. Please review your dashboard for details.</p>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Rebal admin dashboard.</p>
        </div>
      `;

    default:
      return `
        <div style="${baseStyles}">
          <h1 style="margin-bottom: 20px;">Admin Notification</h1>
          <p>${data.subject}</p>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
            ${JSON.stringify(data.additionalDetails || {}, null, 2)}
          </pre>
          <p style="color: #6b7280; font-size: 14px;">This is an automated alert from your Rebal admin dashboard.</p>
        </div>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    const resendApiKey = getEnv("RESEND_API_KEY");
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const resend = new Resend(resendApiKey);

    const data: AdminNotificationRequest = await req.json();

    console.log("Sending admin notification:", data.type, data.subject);

    const html = getEmailTemplate(data);

    const emailResponse = await resend.emails.send({
      from: "Rebal Alerts <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: data.subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log notification to database for audit trail
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("admin_notifications_log").insert({
      type: data.type,
      subject: data.subject,
      recipient: ADMIN_EMAIL,
      metadata: {
        companyId: data.companyId,
        companyName: data.companyName,
        amount: data.amount,
        failedCount: data.failedCount,
        gracePeriodEnd: data.gracePeriodEnd,
        ...data.additionalDetails,
      },
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
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
