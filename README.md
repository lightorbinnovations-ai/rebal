# 🏠 REBAL - Nigerian Property Marketplace Platform

**A complete SaaS platform for Nigerian real estate agents, marketers, and affiliates.**

---

## 🎯 Overview

REBAL enables real estate professionals to:
- 📱 Create branded property websites
- 🏢 List and manage properties
- 💰 Accept payments via Paystack
- 👥 Earn through referral program
- 📊 Track analytics and leads

---

## 👥 User Types

```
┌─────────────────────────────────────────────────────┐
│                    USER TYPES                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🏠 REALTOR                  👤 AFFILIATE            │
│  ─────────────               ───────────────         │
│  • List properties           • Share referral link   │
│  • Manage inquiries          • Earn commissions      │
│  • Custom branding           • Track conversions     │
│  • Analytics dashboard       • Withdraw earnings     │
│  • Short links & QR codes    • Simple dashboard      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Profile Completion Requirements

Before realtors can add properties or share their site, they must complete:

| Field | Required | Min Length |
|-------|----------|------------|
| Business Name | ✅ | 2 chars |
| Phone Number | ✅ | Valid format |
| Business Email | ✅ | Valid email |
| Address | ✅ | 5 chars |
| Tagline | ✅ | 5 chars |
| About Business | ✅ | 20 chars |

**Affiliates skip this requirement** - they only need to sign up to start earning.

---

## 💳 Subscription Tiers

| Feature | Trial | Starter | Pro | Premium |
|---------|-------|---------|-----|---------|
| Properties | 1 | 10 | 30 | Unlimited |
| Duration | 14 days | Monthly/Yearly | Monthly/Yearly | Monthly/Yearly |
| Custom Branding | ❌ | ✅ | ✅ | ✅ |
| Analytics | Basic | Standard | Advanced | Advanced |
| Priority Support | ❌ | ❌ | ✅ | ✅ |

---

## 💰 Referral System

```
┌──────────────────────────────────────────────────────────────┐
│                    REFERRAL FLOW                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   [Referrer]                                                  │
│       │                                                       │
│       │ 1. Share link: yoursite.com/?ref=CODE-XXXX           │
│       ▼                                                       │
│   [New User] ─── 2. Signs up ──► [REBAL]                     │
│       │                              │                        │
│       │                              │ 3. Track referral      │
│       │                              ▼                        │
│       │                         [Referral Created]            │
│       │                              │                        │
│       │ 4. Makes payment             │                        │
│       ▼                              ▼                        │
│   [Payment] ────────────────► [10% Commission]               │
│                                      │                        │
│                                      ▼                        │
│                              [Referrer Wallet]               │
│                                      │                        │
│                                      ▼                        │
│                              [Withdrawal Request]             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Commission Rate:** 10% of all payments from referred users

---

## 🔄 Payment Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [User Dashboard]                                              │
│         │                                                       │
│         │ Click "Upgrade"                                       │
│         ▼                                                       │
│   [paystack-initialize] ──► Create payment ──► [Paystack]      │
│         │                                                       │
│         │ Redirect to Paystack                                  │
│         ▼                                                       │
│   [Paystack Checkout] ◄── Enter card details                   │
│         │                                                       │
│         │ Payment complete                                      │
│         ▼                                                       │
│   [paystack-verify] ◄── Verify transaction                     │
│         │                                                       │
│         │ Update subscription                                   │
│         ▼                                                       │
│   [Subscription Active] ──► Access unlocked                    │
│                                                                 │
│   [Paystack Webhook] ──► Handle renewal/failure events         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Payments | Paystack |
| Email | Resend |
| Hosting | Netlify |
| Auth | Google OAuth |

---

## 📁 Project Structure

```
rebal/
├── src/
│   ├── components/        # UI components
│   │   ├── dashboard/     # Dashboard-specific
│   │   ├── company/       # Public company pages
│   │   ├── admin/         # Admin panel
│   │   └── ui/            # shadcn components
│   ├── pages/             # Route pages
│   ├── hooks/             # React hooks
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript types
│   └── lib/               # Utilities
├── supabase/
│   └── functions/         # Edge functions
├── public/                # Static assets
└── docs/                  # Documentation
```

---

## 🚀 Quick Start (Development)

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/rebal.git
cd rebal

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [PRODUCTION_SETUP_GUIDE.md](./PRODUCTION_SETUP_GUIDE.md) | Complete deployment guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Quick deployment checklist |
| [DEPLOYMENT_DATABASE_SCHEMA.sql](./DEPLOYMENT_DATABASE_SCHEMA.sql) | Database SQL schema |
| [EDGE_FUNCTIONS_REFERENCE.md](./EDGE_FUNCTIONS_REFERENCE.md) | Edge functions documentation |
| [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) | Feature testing checklist |

---

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Rate limiting on public endpoints
- ✅ Webhook signature verification
- ✅ Secure password requirements
- ✅ HTTPS enforced
- ✅ API key protection

---

## 📊 Admin Panel

Access at `/admin/login`

**Features:**
- 👥 User management
- 🏢 Company oversight
- 💳 Payment tracking
- 📊 Platform analytics
- 🎫 Support tickets
- ✅ Verification requests
- 💸 Withdrawal processing

---

## 🔧 Environment Variables

### Netlify (Frontend)
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
VITE_SUPABASE_PROJECT_ID=xxxx
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
```

### Supabase (Edge Functions)
```bash
PAYSTACK_SECRET_KEY=sk_live_xxxx
RESEND_API_KEY=re_xxxx
```

---

## 📞 Support

| Resource | Link |
|----------|------|
| Supabase | [discord.supabase.com](https://discord.supabase.com) |
| Paystack | support@paystack.com |
| Netlify | [community.netlify.com](https://community.netlify.com) |

---

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ for Nigerian Real Estate Professionals**
   
 