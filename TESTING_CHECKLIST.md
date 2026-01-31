# REBAL Comprehensive Testing Checklist

This document provides a step-by-step testing guide to verify all features of the REBAL platform work correctly after deployment.

---

## Prerequisites

Before testing, ensure:
- [ ] Application is deployed and accessible
- [ ] Supabase database is set up with schema
- [ ] All Edge Functions are deployed
- [ ] Environment variables are configured
- [ ] Paystack webhook is configured
- [ ] Google OAuth is set up

---

## 1. Public Pages Testing

### 1.1 Landing Page (`/`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] Dark/Light mode toggle works
- [ ] Navigation links work (Features, Pricing, About, Contact)
- [ ] CTA buttons navigate to `/auth` or `/pricing`
- [ ] Mobile responsive layout (test on phone/tablet viewport)
- [ ] Footer links work correctly
- [ ] Scroll animations work smoothly

### 1.2 Pricing Page (`/pricing`)
- [ ] All plan cards display correctly
- [ ] Monthly/Yearly toggle works
- [ ] Prices update when toggle changes
- [ ] "Get Started" buttons navigate to `/auth`
- [ ] FAQ accordion expands/collapses
- [ ] Mobile layout is correct

### 1.3 About Page (`/about`)
- [ ] Content loads correctly
- [ ] Images display properly
- [ ] Navigation to other pages works

### 1.4 Contact Page (`/contact`)
- [ ] Contact form displays
- [ ] Form validation works (name min 2 chars, email valid, message min 10 chars)
- [ ] Character counter shows for message field (max 2000)
- [ ] Form submission sends data to database (check `contact_messages` table)
- [ ] Success toast shows ONLY after successful submission
- [ ] Form clears after successful submission
- [ ] Rate limiting prevents spam (max 3 per hour per email)
- [ ] Social links work (if present)

### 1.5 Properties Marketplace (`/properties`)
- [ ] Properties grid loads
- [ ] Search filter works
- [ ] Property type filter works
- [ ] Purpose filter (Sale/Rent) works
- [ ] Price range filter works
- [ ] State/City filters work
- [ ] Clear filters button works
- [ ] Infinite scroll loads more properties
- [ ] Empty state shows when no results
- [ ] Property cards display correctly
- [ ] Clicking card navigates to property details

### 1.6 Terms & Privacy Pages
- [ ] `/terms` loads correctly
- [ ] `/privacy` loads correctly
- [ ] Contact email in Privacy Policy is correct: `rebalpros@gmail.com`

### 1.7 404 Page
- [ ] Invalid routes show 404 page (not blank)
- [ ] 404 page has "Go Home" and "Go Back" buttons
- [ ] No console errors logged for route info

---

## 2. Authentication Testing

### 2.1 Google OAuth Flow (`/auth`)
- [ ] Auth page loads with Google button
- [ ] Clicking "Continue with Google" opens OAuth popup
- [ ] After login, redirects to `/dashboard`
- [ ] User session persists on page refresh
- [ ] Logged-in users are redirected from `/auth` to `/dashboard`

### 2.2 Referral Code Handling
- [ ] Visit `/auth?ref=TESTCODE` 
- [ ] Referral code is stored in localStorage
- [ ] After signup, referral is processed correctly
- [ ] Referrer gets notification (if code is valid)

### 2.3 Logout
- [ ] Logout button in navbar works
- [ ] Logout button in dashboard works
- [ ] Session is cleared after logout
- [ ] Redirects to `/auth` after logout

---

## 3. Dashboard Testing

### 3.1 Dashboard Overview (`/dashboard`)
- [ ] Dashboard loads after login
- [ ] Welcome message shows company name
- [ ] Stats cards show correct counts
- [ ] Recent properties list displays
- [ ] Quick action buttons work
- [ ] "View Public Page" link opens company page
- [ ] Website Health Score displays
- [ ] Lead Scoring section works
- [ ] Share section shows correct links

### 3.2 Onboarding Flow (New Users)

#### Realtor Onboarding
- [ ] New users see account type selection
- [ ] "List Properties" (Realtor) option available
- [ ] "Just Earn Commissions" (Affiliate) option available
- [ ] Selecting Realtor shows company setup form
- [ ] Company name field validates
- [ ] Slug is auto-generated from company name
- [ ] Onboarding completes successfully
- [ ] Dashboard loads after onboarding with realtor features
- [ ] Onboarding checklist appears
- [ ] Profile completion banner shows if profile incomplete

#### Affiliate Onboarding
- [ ] Selecting Affiliate shows simplified form
- [ ] Display name field validates
- [ ] Affiliate signup completes successfully
- [ ] Dashboard loads with affiliate-specific UI
- [ ] Sidebar shows only: Overview, Referrals, Settings, Help
- [ ] Properties, Inquiries, Analytics, Branding, Links are hidden
- [ ] Referral stats display on overview page
- [ ] "Upgrade to Realtor" button visible

### 3.3 Properties Management (`/dashboard/properties`)
- [ ] Properties list loads
- [ ] Property count shows correctly
- [ ] Search filter works
- [ ] Property type filter works
- [ ] Status filter works
- [ ] "Add Property" button works (if limit not reached)
- [ ] Property limit banner shows when limit reached
- [ ] Property cards display correctly
- [ ] Edit button opens edit form
- [ ] Delete button shows confirmation
- [ ] Delete removes property
- [ ] "View Live" opens property page
- [ ] Copy short link works
- [ ] Bulk generate links works

### 3.4 Add/Edit Property (`/dashboard/properties/new`)
- [ ] Form loads correctly
- [ ] All required fields validate
- [ ] Property type dropdown works
- [ ] Purpose dropdown works
- [ ] State/City/Area dropdowns cascade
- [ ] Price field accepts numbers
- [ ] Features can be added/removed
- [ ] Main image upload works
- [ ] Gallery images upload works (multiple)
- [ ] Image preview shows uploaded images
- [ ] Remove image works
- [ ] SEO fields work
- [ ] SEO fields work
- [ ] Status dropdown works
- [ ] Is Active toggle works
- [ ] Save button creates property
- [ ] Success toast shows
- [ ] Redirects to properties list
- [ ] Edit mode loads existing property data
- [ ] Edit saves changes correctly

### 3.5 Inquiries (`/dashboard/inquiries`)
- [ ] Inquiries list loads
- [ ] Search works
- [ ] Status filter works
- [ ] Inquiry cards display correctly
- [ ] Status can be changed
- [ ] Lead score displays
- [ ] Empty state shows when no inquiries

### 3.6 Analytics (`/dashboard/analytics`)
- [ ] Analytics page loads
- [ ] Date range picker works
- [ ] Charts display data
- [ ] Stats cards show correct values
- [ ] Export functionality works (if available)

### 3.7 Short Links (`/dashboard/links`)
- [ ] Links list loads
- [ ] Create new link works
- [ ] Copy link works
- [ ] Click count displays
- [ ] QR code generates
- [ ] Delete link works

### 3.8 Referrals (`/dashboard/referrals`)
- [ ] Referrals page loads
- [ ] Referral code displays
- [ ] Copy referral link works
- [ ] Referral stats display
- [ ] Referral list shows referrals
- [ ] Wallet balance displays
- [ ] Withdrawal request works (if balance > 0)

### 3.9 Branding (`/dashboard/branding`)
- [ ] Branding page loads
- [ ] Logo upload works
- [ ] Hero image upload works
- [ ] Profile picture upload works
- [ ] Company name/tagline editable
- [ ] Primary color picker works
- [ ] Secondary color picker works
- [ ] Font selection works
- [ ] Button style selection works
- [ ] Footer colors work
- [ ] Preview updates in real-time
- [ ] Save changes works
- [ ] OG Image generation works

### 3.10 Settings (`/dashboard/settings`)

#### Business Tab (Default - Profile Completion)
- [ ] Business Profile section loads
- [ ] Profile completion percentage displays
- [ ] Progress bar shows completion status
- [ ] Accordion sections expand/collapse
- [ ] Business Name field validates (required, min 2 chars)
- [ ] Tagline field validates (required, min 5 chars)
- [ ] Description field validates (required, min 20 chars)
- [ ] Phone field validates (required, valid format)
- [ ] Email field validates (required, valid email)
- [ ] Address field validates (required, min 5 chars)
- [ ] WhatsApp field validates (optional, valid format)
- [ ] Bank Name field works (optional)
- [ ] Account Number validates (10 digits)
- [ ] Account Holder Name works (optional)
- [ ] Save button updates company data
- [ ] After save, profile completion status updates
- [ ] Incomplete profiles show warning badges
- [ ] Complete profiles show green checkmark

#### Account Tab
- [ ] Profile info displays correctly
- [ ] Email shows (disabled)
- [ ] Account type badge shows
- [ ] Change Password button works (email accounts only)

#### Subscription Tab
- [ ] Current plan displays
- [ ] Trial days remaining shows (if trialing)
- [ ] Plan comparison cards display
- [ ] Monthly/Yearly toggle works
- [ ] Upgrade button initiates payment
- [ ] After payment, subscription updates
- [ ] Cancel subscription works (if active)

#### Billing Tab
- [ ] Payment history displays
- [ ] Payment status badges show correctly
- [ ] Empty state shows if no payments

#### Support Tab
- [ ] Support tickets list loads
- [ ] Create ticket form works
- [ ] Ticket status displays

#### Features Tab
- [ ] Custom domain settings show
- [ ] Verification badge settings show
- [ ] Features locked by plan show upgrade prompt

### 3.11 Help (`/dashboard/help`)
- [ ] Help page loads
- [ ] Documentation links work
- [ ] Support options display

### 3.12 Saved Searches (`/dashboard/saved-searches`)
- [ ] Saved searches list loads
- [ ] Create search works
- [ ] Email notifications toggle works
- [ ] Delete search works
- [ ] View search results works

---

## 4. Public Company Pages Testing

### 4.1 Company Homepage (`/{company-slug}`)
- [ ] Page loads correctly
- [ ] Company branding applies (colors, fonts)
- [ ] Hero section shows correctly
- [ ] Featured properties display
- [ ] "View All Properties" button works
- [ ] Share section works
- [ ] Footer shows company info
- [ ] Mobile responsive

### 4.2 Company Properties (`/{company-slug}/properties`)
- [ ] Properties grid loads
- [ ] Filters work
- [ ] Property cards link to details
- [ ] Pagination/infinite scroll works

### 4.3 Property Details (`/{company-slug}/property/{property-slug}`)
- [ ] Property page loads
- [ ] Images display correctly
- [ ] Gallery modal works
- [ ] Property details display
- [ ] Features list displays
- [ ] Location shows
- [ ] Inquiry form works
- [ ] Submit inquiry creates record
- [ ] Success message shows
- [ ] Share section works
- [ ] Related properties show
- [ ] Back navigation works

### 4.4 Company About (`/{company-slug}/about`)
- [ ] About page loads
- [ ] Company description displays

### 4.5 Company Contact (`/{company-slug}/contact`)
- [ ] Contact page loads
- [ ] Contact form works
- [ ] Company contact info displays

---

## 5. Short Links Testing

### 5.1 Short Link Redirect (`/r/{code}`)
- [ ] Short link redirects to correct page
- [ ] Click count increments
- [ ] Invalid code shows 404

---

## 6. Admin Panel Testing

### 6.1 Admin Authentication & Security
- [ ] Unauthenticated users cannot access `/admin` (redirects to login)
- [ ] Non-admin users cannot access admin panel (shows "Access denied")
- [ ] Login page loads at `/admin/login`
- [ ] Sign up creates account but requires admin role assignment
- [ ] Login with wrong credentials shows error
- [ ] Successful admin login redirects to admin dashboard
- [ ] Session persists on page refresh
- [ ] Logout clears session and redirects to login

### 6.2 Admin Dashboard (`/admin`)
- [ ] Dashboard loads only for authenticated admins
- [ ] Stats display correctly (users, companies, properties, inquiries)
- [ ] Recent activity shows
- [ ] Quick actions work
- [ ] Subscription metrics widget loads
- [ ] Grace period manager works
- [ ] MRR chart displays

### 6.3 Admin Users (`/admin/users`)
- [ ] Users list loads
- [ ] Search works
- [ ] User details display
- [ ] Actions work (if any)

### 6.4 Admin Companies (`/admin/companies`)
- [ ] Companies list loads
- [ ] Search works
- [ ] Filters work
- [ ] Company details display
- [ ] Verification toggle works

### 6.5 Admin Properties (`/admin/properties`)
- [ ] Properties list loads
- [ ] Filters work
- [ ] Property details display

### 6.6 Admin Payments (`/admin/payments`)
- [ ] Payments list loads
- [ ] Filters work
- [ ] Payment details display
- [ ] Status badges show correctly

### 6.7 Admin Referrals (`/admin/referrals`)
- [ ] Referrals list loads
- [ ] Stats display
- [ ] Referral details show

### 6.8 Admin Withdrawals (`/admin/withdrawals`)
- [ ] Withdrawals list loads
- [ ] Pending requests show
- [ ] Approve/Reject works
- [ ] Status updates correctly

### 6.9 Admin Analytics (`/admin/analytics`)
- [ ] Analytics page loads
- [ ] Charts display
- [ ] Date range works

### 6.10 Admin Support (`/admin/support`)
- [ ] Tickets list loads
- [ ] Ticket details show
- [ ] Reply to ticket works
- [ ] Status update works

### 6.11 Admin Verifications (`/admin/verifications`)
- [ ] Verification requests load
- [ ] Approve works
- [ ] Reject works
- [ ] Email is sent to user

### 6.12 Admin Settings (`/admin/settings`)
- [ ] Settings page loads
- [ ] Platform settings configurable

---

## 7. Payment Flow Testing

### 7.1 Subscription Upgrade
- [ ] Click upgrade button
- [ ] Paystack popup opens
- [ ] Complete test payment
- [ ] Webhook processes payment
- [ ] Subscription activates
- [ ] Features unlock immediately
- [ ] Payment record created
- [ ] Notification sent to user

### 7.2 Payment Verification
- [ ] Return from Paystack
- [ ] Payment verified automatically
- [ ] Success toast shows
- [ ] Dashboard reflects new subscription

### 7.3 Subscription Cancellation
- [ ] Click cancel subscription
- [ ] Confirmation dialog shows
- [ ] Confirm cancellation
- [ ] Subscription cancelled
- [ ] Downgrade to trial limits
- [ ] Notification sent

### 7.4 Failed Payment Handling
- [ ] Simulate failed payment (via webhook)
- [ ] Grace period starts
- [ ] User notified
- [ ] Grace period warning shows in dashboard
- [ ] After grace period expires, subscription downgrades

---

## 8. Notification Testing

### 8.1 In-App Notifications
- [ ] Notification bell shows in header
- [ ] Notifications dropdown works
- [ ] Unread count shows
- [ ] Clicking notification marks as read
- [ ] New inquiry creates notification
- [ ] Payment success creates notification
- [ ] Referral creates notification

### 8.2 Email Notifications
- [ ] Subscription reminder emails work
- [ ] Support response emails work
- [ ] Verification status emails work

---

## 9. Social Sharing Testing

### 9.1 Open Graph Tags
- [ ] Test company page URL with Facebook debugger
- [ ] Test property page URL with LinkedIn inspector
- [ ] Test with Twitter card validator
- [ ] OG image displays correctly
- [ ] OG title is correct
- [ ] OG description is correct

### 9.2 Short Link OG Tags
- [ ] Short link shows OG tags when shared
- [ ] Crawlers get HTML with OG tags
- [ ] Regular users get redirected

---

## 10. Mobile Responsiveness Testing

### 10.1 Test on Mobile Viewports
- [ ] Landing page
- [ ] Auth page
- [ ] Dashboard (all pages)
- [ ] Properties marketplace
- [ ] Company pages
- [ ] Property details
- [ ] Admin panel

### 10.2 Test Mobile Navigation
- [ ] Mobile menu opens/closes
- [ ] Navigation links work
- [ ] Dropdowns work on touch
- [ ] Forms are usable on mobile
- [ ] Images load properly

---

## 11. Performance Testing

### 11.1 Page Load Times
- [ ] Landing page loads < 3s
- [ ] Dashboard loads < 3s
- [ ] Properties list loads < 3s
- [ ] Images are lazy loaded
- [ ] No layout shifts (CLS)

### 11.2 API Response Times
- [ ] Edge functions respond < 1s
- [ ] Database queries are optimized
- [ ] Rate limiting works correctly

---

## 12. Security Testing

### 12.1 Authentication
- [ ] Protected routes redirect to login
- [ ] Admin routes require admin role
- [ ] Session expires correctly
- [ ] Tokens refresh properly

### 12.2 Authorization
- [ ] Users can only access their own data
- [ ] RLS policies work correctly
- [ ] Admin-only actions are protected

### 12.3 Input Validation
- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized (test `<script>` tags in business name preview)
- [ ] HTML tags are stripped from inputs
- [ ] File uploads are validated
- [ ] Rate limits prevent abuse
- [ ] Input maxlength attributes prevent oversized inputs
- [ ] Required fields have HTML `required` attribute

### 12.4 Form Security
- [ ] Contact form validates name (2-100 chars)
- [ ] Contact form validates email format
- [ ] Contact form validates message (10-2000 chars)
- [ ] Inquiry forms have proper validation
- [ ] Password fields have `autocomplete` attributes

---

## 13. Edge Cases Testing

### 13.1 Empty States
- [ ] No properties message
- [ ] No inquiries message
- [ ] No payments message
- [ ] No referrals message
- [ ] No contact messages (admin)

### 13.2 Error Handling
- [ ] Network errors show toast
- [ ] Form validation errors display
- [ ] 404 page works (styled, with navigation)
- [ ] Error boundary catches crashes
- [ ] Loading skeletons show during data fetch

### 13.3 Concurrent Operations
- [ ] Multiple tabs sync correctly
- [ ] Real-time updates work
- [ ] No race conditions

---

## 14. Cron Jobs Testing

### 14.1 GitHub Actions Cron
- [ ] Manually trigger workflow
- [ ] Check-saved-searches runs
- [ ] Subscription-reminders runs
- [ ] Check-grace-periods runs
- [ ] Cleanup-payments runs
- [ ] Logs show in GitHub Actions

---

## Testing Sign-Off

| Section | Tested By | Date | Status |
|---------|-----------|------|--------|
| Public Pages | | | |
| Authentication | | | |
| Dashboard | | | |
| Company Pages | | | |
| Admin Panel | | | |
| Payments | | | |
| Notifications | | | |
| Mobile | | | |
| Performance | | | |
| Security | | | |

---

## Known Issues / Notes

Document any issues discovered during testing here:

1. 
2. 
3. 

---

## Post-Testing Actions

After completing testing:
- [ ] Fix any critical bugs found
- [ ] Update documentation if needed
- [ ] Verify all edge functions are deployed
- [ ] Confirm cron jobs are scheduled
- [ ] Set up monitoring/alerting
- [ ] Create production admin user
