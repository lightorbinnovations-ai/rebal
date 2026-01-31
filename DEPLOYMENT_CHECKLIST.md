# ✅ REBAL Deployment Checklist

**Quick reference checklist for deploying REBAL to production.**

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Supabase account  
- [ ] Netlify account
- [ ] Google Cloud Console access
- [ ] Paystack account
- [ ] Resend account

---

## 1️⃣ GitHub Export

- [ ] Export from Lovable to GitHub
- [ ] Clone repository locally (optional)
- [ ] Repository is private

---

## 2️⃣ Supabase Setup

### Create Project
- [ ] New project created
- [ ] Database password saved securely
- [ ] Region selected

### Get Credentials
- [ ] Project URL copied
- [ ] anon key copied
- [ ] service_role key copied
- [ ] Project reference ID noted

### Database Schema
- [ ] `DEPLOYMENT_DATABASE_SCHEMA.sql` executed
- [ ] All tables created
- [ ] RLS policies active
- [ ] Subscription plans inserted

---

## 3️⃣ Authentication

### Google OAuth
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] JavaScript origins added
- [ ] Redirect URIs added
- [ ] Client ID/Secret copied

### Supabase Auth
- [ ] Google provider enabled
- [ ] Client ID pasted
- [ ] Client Secret pasted
- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Email confirmation disabled

---

## 4️⃣ Edge Functions

### Deploy Functions
- [ ] Supabase CLI installed
- [ ] CLI logged in
- [ ] Project linked
- [ ] All 19 functions deployed

### Set Secrets
- [ ] `PAYSTACK_SECRET_KEY` set
- [ ] `RESEND_API_KEY` set

### Verify
- [ ] All functions show "Active" in dashboard

---

## 5️⃣ Paystack

- [ ] Live API keys obtained
- [ ] Webhook URL configured:
  ```
  https://PROJECT_REF.supabase.co/functions/v1/paystack-webhook
  ```
- [ ] Webhook events selected
- [ ] Subscription plans created

### Plans to Create

| Plan | Monthly | Yearly |
|------|---------|--------|
| Starter | ₦5,000 | ₦50,000 |
| Pro | ₦15,000 | ₦150,000 |
| Premium | ₦35,000 | ₦350,000 |

---

## 6️⃣ Resend

- [ ] Account created
- [ ] API key generated
- [ ] Domain added (optional)
- [ ] Domain verified (if added)

---

## 7️⃣ Netlify

### Setup
- [ ] Repository connected
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`

### Environment Variables

| Variable | Set? |
|----------|------|
| `VITE_SUPABASE_URL` | [ ] |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | [ ] |
| `VITE_SUPABASE_PROJECT_ID` | [ ] |
| `VITE_PAYSTACK_PUBLIC_KEY` | [ ] |

### Deploy
- [ ] Site deployed successfully
- [ ] Netlify URL working

---

## 8️⃣ Post-Deploy Updates

- [ ] Supabase Site URL updated to Netlify URL
- [ ] Supabase redirect URLs include Netlify
- [ ] Google OAuth origins include Netlify
- [ ] Google OAuth redirects include Netlify

---

## 9️⃣ Cron Jobs

### GitHub Actions Secrets
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_ANON_KEY` added

### Verify Workflows
- [ ] Workflow file present in `.github/workflows/`
- [ ] Manual test run successful

---

## 🔟 Admin Setup

- [ ] Created account via app
- [ ] Completed onboarding
- [ ] Admin role granted via SQL
- [ ] Admin panel accessible at `/admin/login`

---

## 🔒 Security Checklist

- [ ] All API keys stored as env vars/secrets
- [ ] service_role key NEVER exposed to frontend
- [ ] RLS enabled on all tables
- [ ] HTTPS enabled on Netlify
- [ ] Paystack webhook verifies signatures
- [ ] Rate limiting configured

---

## ✅ Feature Verification

- [ ] Homepage loads correctly
- [ ] Google Sign-in works
- [ ] User can create company profile
- [ ] Properties can be added
- [ ] Property pages publicly visible
- [ ] Inquiry form submits
- [ ] Payment flow works (test mode)
- [ ] Email notifications sent
- [ ] Short links redirect
- [ ] Referral tracking works
- [ ] Affiliate signup works
- [ ] Admin panel works

---

## 🚀 Launch Checklist

Final checks before going live:

- [ ] Switch Paystack to live mode
- [ ] Update to live API keys
- [ ] Test payment with real card
- [ ] Verify all email templates
- [ ] Set up monitoring/alerts
- [ ] Back up database
- [ ] Document admin procedures

---

**🎉 You're ready to launch!**
