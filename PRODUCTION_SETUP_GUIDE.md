# 🚀 REBAL Production Setup Guide

**Complete step-by-step guide to deploy REBAL to production with your own Supabase and Netlify.**

---

## 📋 Quick Reference

| Service | Purpose | Required |
|---------|---------|----------|
| 🗄️ Supabase | Database + Auth + Edge Functions | ✅ Yes |
| 🌐 Netlify | Frontend hosting | ✅ Yes |
| 💳 Paystack | Payment processing | ✅ Yes |
| 📧 Resend | Email notifications | ✅ Yes |
| 🔐 Google Cloud | OAuth login | ✅ Yes |

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        NETLIFY                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Frontend (Vite)                   │    │
│  │   • Environment Variables for API connections        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Database   │  │     Auth     │  │ Edge Functions  │   │
│  │  PostgreSQL  │  │ Google OAuth │  │    (Deno)       │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Paystack │   │  Resend  │   │  Google  │
        │ Payments │   │  Emails  │   │  OAuth   │
        └──────────┘   └──────────┘   └──────────┘
```

---

## Step 1️⃣ Export Code to GitHub

### From Lovable:

1. Click **GitHub** button (top right)
2. Click **Export to GitHub**
3. Name: `rebal-production`
4. Visibility: **Private** (recommended)
5. Click **Export**

### Clone locally (optional):
```bash
git clone https://github.com/YOUR_USERNAME/rebal-production.git
cd rebal-production
npm install
```

---

## Step 2️⃣ Create Supabase Project

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com) → Sign in
2. Click **New Project**
3. Fill details:
   - **Name**: `rebal-production`
   - **Password**: Generate strong password 📝 *Save this!*
   - **Region**: Closest to your users
4. Click **Create** → Wait ~2 minutes

### 2.2 Get Your Credentials

Go to **Settings → API** and copy:

| Credential | Example | Save As |
|------------|---------|---------|
| Project URL | `https://xxxx.supabase.co` | `SUPABASE_URL` |
| anon key | `eyJhbG...` | `SUPABASE_ANON_KEY` |
| service_role key | `eyJhbG...` | `SUPABASE_SERVICE_ROLE_KEY` |
| Project Ref | `xxxx` (from URL) | `PROJECT_REF` |

---

## Step 3️⃣ Deploy Database Schema

### 3.1 Run Schema SQL

1. In Supabase → **SQL Editor**
2. Click **New query**
3. Copy entire contents of `DEPLOYMENT_DATABASE_SCHEMA.sql`
4. Paste and click **Run**
5. ✅ Verify no errors

### 3.2 Verify Setup

Check **Table Editor** for these tables:
- ✅ companies
- ✅ properties
- ✅ subscriptions
- ✅ subscription_plans
- ✅ payments
- ✅ inquiries
- ✅ referrals
- ✅ notifications
- ✅ short_links
- ✅ user_roles

### 3.3 Verify Subscription Plans

Run this in SQL Editor:
```sql
SELECT * FROM subscription_plans;
```
Should return: `starter`, `pro`, `premium`

---

## Step 4️⃣ Configure Authentication

### 4.1 Google OAuth Setup

#### In Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**

If prompted for consent screen:
- User Type: **External**
- App name: `REBAL`
- Support email: Your email
- Scopes: `email`, `profile`, `openid`

5. Create OAuth client:
   - Type: **Web application**
   - Name: `REBAL Production`
   
6. **Authorized JavaScript origins**:
   ```
   https://your-app.netlify.app
   ```
   
7. **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

8. Copy **Client ID** and **Client Secret**

#### In Supabase Dashboard:

1. **Authentication → Providers → Google**
2. Enable **Sign in with Google**
3. Paste Client ID
4. Paste Client Secret
5. Save

### 4.2 Configure URLs

1. **Authentication → URL Configuration**
2. Set **Site URL**: `https://your-app.netlify.app`
3. Add **Redirect URLs**:
   - `https://your-app.netlify.app/**`
   - `http://localhost:8080/**`

### 4.3 Disable Email Confirmation

1. **Authentication → Settings**
2. Toggle **Enable email confirmations** → **OFF**

---

## Step 5️⃣ Deploy Edge Functions

### 5.1 Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (any platform)
npm install -g supabase
```

### 5.2 Login & Link

```bash
supabase login
cd rebal-production
supabase link --project-ref YOUR_PROJECT_REF
```

### 5.3 Deploy All Functions

```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

This deploys **19 edge functions**:

| Function | Purpose |
|----------|---------|
| `paystack-initialize` | Start payment |
| `paystack-verify` | Verify payment |
| `paystack-webhook` | Handle Paystack events |
| `cancel-subscription` | Cancel sub |
| `check-grace-periods` | Check expired payments |
| `check-property-limit` | Enforce plan limits |
| `check-saved-searches` | Notify on new matches |
| `cleanup-payments` | Clean abandoned payments |
| `generate-og-image` | Create OG images |
| `generate-property-og` | Property OG images |
| `og-meta` | Return OG metadata |
| `public-api` | Public inquiry/analytics API |
| `send-admin-notification` | Admin alerts |
| `send-notification-email` | User emails |
| `short-link-redirect` | Short link handler |
| `social-preview` | Social preview HTML |
| `subscription-reminders` | Renewal reminders |
| `track-referral` | Referral tracking |
| `verify-domain` | Custom domain verification |

### 5.4 Set Edge Function Secrets

```bash
# Required secrets
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxx --project-ref YOUR_PROJECT_REF

supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxx --project-ref YOUR_PROJECT_REF
```

### 5.5 Verify Deployment

1. Go to Supabase → **Edge Functions**
2. Verify all 19 functions show **Active**

---

## Step 6️⃣ Set Up Paystack

### 6.1 Get Credentials

1. [Paystack Dashboard](https://dashboard.paystack.com)
2. **Settings → API Keys & Webhooks**
3. Copy:
   - **Live Secret Key**: `sk_live_...` → For Supabase secrets
   - **Live Public Key**: `pk_live_...` → For Netlify env vars

### 6.2 Configure Webhook

1. **Settings → API Keys & Webhooks**
2. Webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
   ```
3. Select events:
   - ✅ `charge.success`
   - ✅ `subscription.create`
   - ✅ `subscription.disable`
   - ✅ `subscription.not_renew`
   - ✅ `invoice.payment_failed`
   - ✅ `refund.processed`

### 6.3 Create Plans in Paystack

Create plans matching your database:

| Plan | Monthly | Yearly |
|------|---------|--------|
| Starter | ₦5,000 | ₦50,000 |
| Pro | ₦15,000 | ₦150,000 |
| Premium | ₦35,000 | ₦350,000 |

---

## Step 7️⃣ Set Up Resend (Email)

### 7.1 Get API Key

1. Go to [resend.com](https://resend.com) → Sign up
2. **API Keys → Create API Key**
3. Name: `REBAL Production`
4. Permission: **Full access**
5. Copy key (starts with `re_`)

### 7.2 Add Domain (Recommended)

1. **Domains → Add domain**
2. Add DNS records as instructed
3. Wait for verification

---

## Step 8️⃣ Deploy to Netlify

### 8.1 Connect Repository

1. [Netlify.com](https://netlify.com) → Sign in
2. **Add new site → Import from GitHub**
3. Select your `rebal-production` repo

### 8.2 Build Settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |

### 8.3 Environment Variables

Add in **Site settings → Environment variables**:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your anon key |
| `VITE_SUPABASE_PROJECT_ID` | Your project ref |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxxxx` |

### 8.4 Deploy

Click **Deploy site** → Wait for build

### 8.5 Update Supabase URLs

1. Go back to Supabase → **Authentication → URL Configuration**
2. Update **Site URL** to your Netlify URL
3. Add Netlify URL to redirect URLs

### 8.6 Update Google OAuth

1. Google Cloud Console → **Credentials**
2. Edit your OAuth client
3. Add Netlify URL to:
   - Authorized JavaScript origins
   - Authorized redirect URIs

---

## Step 9️⃣ Configure Cron Jobs

### 9.1 GitHub Actions Secrets

1. GitHub repo → **Settings → Secrets → Actions**
2. Add:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key

### 9.2 Scheduled Jobs

The `.github/workflows/cron-jobs.yml` runs:

| Job | Schedule |
|-----|----------|
| `check-saved-searches` | Daily 8:00 AM UTC |
| `subscription-reminders` | Daily 9:00 AM UTC |
| `check-grace-periods` | Every 6 hours |
| `cleanup-payments` | Every 2 hours |

---

## Step 🔟 Create Admin User

### 10.1 Create Account

1. Go to your deployed app
2. Sign up with Google
3. Complete onboarding

### 10.2 Grant Admin Role

In Supabase SQL Editor:

```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Grant super_admin role (replace USER_ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'super_admin');
```

### 10.3 Access Admin Panel

Go to `/admin/login` and sign in

---

## ✅ Final Verification Checklist

- [ ] Homepage loads
- [ ] Google Sign-in works
- [ ] Company profile can be created
- [ ] Properties can be added
- [ ] Property pages are public
- [ ] Inquiry forms work
- [ ] Payments process (test mode first)
- [ ] Emails are received
- [ ] Short links redirect
- [ ] Referral tracking works
- [ ] Admin panel accessible

---

## 🔧 Troubleshooting

### "Unauthorized" Error
- Check anon key in Netlify env vars
- Verify edge functions are deployed

### Google OAuth Not Working
- Verify redirect URIs match exactly
- Check consent screen is configured
- Ensure scopes include email, profile, openid

### Payments Not Processing
- Check Paystack webhook URL
- Verify secret key in Supabase secrets
- Check edge function logs

### Emails Not Sending
- Verify Resend API key
- Check domain verification status
- View edge function logs

---

## 📞 Support Resources

| Service | Support |
|---------|---------|
| Supabase | [discord.supabase.com](https://discord.supabase.com) |
| Paystack | support@paystack.com |
| Resend | Dashboard tickets |
| Netlify | [community.netlify.com](https://community.netlify.com) |

---

**🎉 Congratulations! Your REBAL platform is now deployed!**
