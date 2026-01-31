import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "support_response" | "verification_approved" | "verification_rejected";
  recipientEmail: string;
  recipientName: string;
  companyName?: string;
  ticketSubject?: string;
  adminResponse?: string;
  rejectionReason?: string;
}

const generateSupportResponseEmail = (data: NotificationRequest): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 28px;">💬</span>
        </div>
        <h1 style="color: #18181b; font-size: 24px; margin: 0;">Support Response Received</h1>
      </div>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        Hi ${data.recipientName},
      </p>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        Our support team has responded to your ticket: <strong>"${data.ticketSubject}"</strong>
      </p>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #3b82f6;">
        <p style="color: #18181b; font-size: 14px; margin: 0; white-space: pre-wrap;">${data.adminResponse}</p>
      </div>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        You can view your tickets anytime in your dashboard under Settings → Support.
      </p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://rebal.site/dashboard/settings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          View Dashboard
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
      
      <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
        This email was sent by Rebal. If you have questions, reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

const generateVerificationApprovedEmail = (data: NotificationRequest): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 28px;">✓</span>
        </div>
        <h1 style="color: #18181b; font-size: 24px; margin: 0;">Congratulations! You're Verified 🎉</h1>
      </div>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        Hi ${data.recipientName},
      </p>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        Great news! Your verification request for <strong>${data.companyName}</strong> has been approved.
      </p>
      
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #166534; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">
          ✅ Verification Badge Active
        </p>
        <p style="color: #166534; font-size: 14px; margin: 0;">
          Your company now displays the verified badge to all visitors
        </p>
      </div>
      
      <h3 style="color: #18181b; font-size: 16px; margin: 24px 0 12px 0;">What this means for you:</h3>
      <ul style="color: #52525b; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Increased trust with potential clients</li>
        <li>Verified badge displayed on your company page</li>
        <li>Enhanced credibility in search results</li>
      </ul>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://rebal.site/dashboard" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          View Your Dashboard
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
      
      <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
        Thank you for being a valued Rebal partner.
      </p>
    </div>
  </div>
</body>
</html>
`;

const generateVerificationRejectedEmail = (data: NotificationRequest): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 28px;">📋</span>
        </div>
        <h1 style="color: #18181b; font-size: 24px; margin: 0;">Verification Update</h1>
      </div>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        Hi ${data.recipientName},
      </p>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
        We've reviewed your verification request for <strong>${data.companyName}</strong>. Unfortunately, we couldn't verify your business at this time.
      </p>
      
      <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Reason:</p>
        <p style="color: #92400e; font-size: 14px; margin: 0;">${data.rejectionReason || "Additional information required for verification."}</p>
      </div>
      
      <h3 style="color: #18181b; font-size: 16px; margin: 24px 0 12px 0;">What you can do:</h3>
      <ul style="color: #52525b; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Review the feedback above</li>
        <li>Gather the required documentation</li>
        <li>Submit a new verification request with updated information</li>
      </ul>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://rebal.site/dashboard/settings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          Submit New Request
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
      
      <p style="color: #a1a1aa; font-size: 13px; text-align: center; margin: 0;">
        Questions? Contact our support team for assistance.
      </p>
    </div>
  </div>
</body>
</html>
`;

// handler starts here
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

    const resendApiKey = getEnv("RESEND_API_KEY");
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      throw new Error("Invalid token");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const data: NotificationRequest = await req.json();

    let html: string;
    let subject: string;

    switch (data.type) {
      case "support_response":
        html = generateSupportResponseEmail(data);
        subject = `Response to your support ticket: ${data.ticketSubject}`;
        break;
      case "verification_approved":
        html = generateVerificationApprovedEmail(data);
        subject = `🎉 Congratulations! ${data.companyName} is now verified`;
        break;
      case "verification_rejected":
        html = generateVerificationRejectedEmail(data);
        subject = `Verification update for ${data.companyName}`;
        break;
      default:
        throw new Error("Invalid notification type");
    }

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Rebal <notifications@resend.dev>",
        to: [data.recipientEmail],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Notification email sent:", emailResult);

    // Log the notification
    await supabaseAdmin.from("admin_notifications_log").insert({
      type: data.type,
      recipient: data.recipientEmail,
      subject,
      status: "sent",
      metadata: { companyName: data.companyName, ticketSubject: data.ticketSubject },
    });

    return new Response(JSON.stringify({ success: true, id: emailResult.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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
