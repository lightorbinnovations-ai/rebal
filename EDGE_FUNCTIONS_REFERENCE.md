# 📡 REBAL Edge Functions Reference

**Complete reference for all Supabase Edge Functions in the project.**

---

## 🔐 Required Secrets

| Secret | Required By | Description |
|--------|-------------|-------------|
| `SUPABASE_URL` | All | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | All | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Most | Admin operations |
| `PAYSTACK_SECRET_KEY` | Payment functions | Paystack API access |
| `RESEND_API_KEY` | Email functions | Email sending |

### Set Secrets Command
```bash
supabase secrets set SECRET_NAME=value --project-ref YOUR_PROJECT_REF
```

---

## 💳 Payment Functions

### `paystack-initialize`
**Purpose:** Start a payment transaction

**Trigger:** User clicks "Upgrade" button

**Endpoint:** `POST /functions/v1/paystack-initialize`

```json
{
  "plan_id": "starter|pro|premium",
  "billing_interval": "monthly|yearly",
  "callback_url": "https://app.com/dashboard/settings?tab=billing"
}
```

---

### `paystack-verify`
**Purpose:** Verify payment after completion

**Trigger:** Callback from Paystack

**Endpoint:** `GET /functions/v1/paystack-verify?reference=xxx`

---

### `paystack-webhook`
**Purpose:** Handle Paystack events

**Trigger:** Webhook from Paystack servers

**Endpoint:** `POST /functions/v1/paystack-webhook`

**Events Handled:**
- `charge.success` - Payment successful
- `subscription.create` - Subscription created
- `subscription.not_renew` - Cancelled auto-renewal
- `subscription.disable` - Subscription disabled
- `invoice.payment_failed` - Payment failed
- `refund.processed` - Refund completed

---

## 📦 Subscription Functions

### `cancel-subscription`
**Purpose:** Cancel user subscription

**Endpoint:** `POST /functions/v1/cancel-subscription`

---

### `check-grace-periods`
**Purpose:** Check expired grace periods and downgrade

**Trigger:** Cron (every 6 hours)

**Endpoint:** `POST /functions/v1/check-grace-periods`

---

### `subscription-reminders`
**Purpose:** Send renewal reminder emails

**Trigger:** Cron (daily 9:00 AM UTC)

**Endpoint:** `POST /functions/v1/subscription-reminders`

---

### `check-property-limit`
**Purpose:** Enforce plan property limits

**Endpoint:** `POST /functions/v1/check-property-limit`

---

### `cleanup-payments`
**Purpose:** Clean abandoned pending payments

**Trigger:** Cron (every 2 hours)

**Endpoint:** `POST /functions/v1/cleanup-payments`

---

## 🖼️ Social Preview Functions

### `generate-og-image`
**Purpose:** Generate OG images for company pages

**Endpoint:** `POST /functions/v1/generate-og-image`

**Rate Limit:** 10/hour/user

---

### `generate-property-og`
**Purpose:** Generate OG images for properties

**Endpoint:** `POST /functions/v1/generate-property-og`

**Rate Limit:** 10/hour/user

---

### `social-preview`
**Purpose:** Serve HTML with OG meta for crawlers

**Endpoint:** `GET /functions/v1/social-preview?path=/company/property/slug`

---

### `og-meta`
**Purpose:** Return JSON OG metadata

**Endpoint:** `GET /functions/v1/og-meta?path=/company-slug`

---

### `short-link-redirect`
**Purpose:** Handle short link redirects

**Endpoint:** `GET /functions/v1/short-link-redirect?code=abc123`

---

## 👥 User Engagement Functions

### `public-api`
**Purpose:** Public API for inquiries and analytics

**Endpoints:**
- `POST /functions/v1/public-api/inquiries`
- `POST /functions/v1/public-api/analytics`

**Rate Limits:**
- Inquiries: 5/email/company/hour
- Analytics: 100/IP/hour

---

### `check-saved-searches`
**Purpose:** Match new properties to saved searches

**Trigger:** Cron (daily 8:00 AM UTC)

**Endpoint:** `POST /functions/v1/check-saved-searches`

---

### `track-referral`
**Purpose:** Track referral visits and conversions

**Endpoint:** `POST /functions/v1/track-referral`

```json
{
  "action": "visit|convert",
  "referral_code": "COMP-AB12",
  "visitor_fingerprint": "abc123"
}
```

---

## 📧 Notification Functions

### `send-admin-notification`
**Purpose:** Send emails to admins

**Endpoint:** `POST /functions/v1/send-admin-notification`

---

### `send-notification-email`
**Purpose:** Send emails to users

**Endpoint:** `POST /functions/v1/send-notification-email`

---

## 🔧 Utility Functions

### `verify-domain`
**Purpose:** Verify custom domain DNS

**Endpoint:** `POST /functions/v1/verify-domain`

---

## 🚀 Deployment Commands

### Deploy All Functions
```bash
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### Deploy Single Function
```bash
supabase functions deploy function-name --project-ref YOUR_PROJECT_REF
```

### View Logs
```bash
supabase functions logs function-name --project-ref YOUR_PROJECT_REF
```

---

## 🧪 Testing Locally

```bash
# Start local Supabase
supabase start

# Serve functions
supabase functions serve

# Test a function
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## 📊 Function Summary

| Function | Type | Schedule |
|----------|------|----------|
| paystack-initialize | API | On demand |
| paystack-verify | API | On demand |
| paystack-webhook | Webhook | On event |
| cancel-subscription | API | On demand |
| check-grace-periods | Cron | Every 6h |
| check-property-limit | API | On demand |
| check-saved-searches | Cron | Daily 8AM |
| cleanup-payments | Cron | Every 2h |
| generate-og-image | API | On demand |
| generate-property-og | API | On demand |
| og-meta | API | On demand |
| public-api | API | On demand |
| send-admin-notification | API | On demand |
| send-notification-email | API | On demand |
| short-link-redirect | API | On demand |
| social-preview | API | On demand |
| subscription-reminders | Cron | Daily 9AM |
| track-referral | API | On demand |
| verify-domain | API | On demand |

**Total: 19 Edge Functions**
