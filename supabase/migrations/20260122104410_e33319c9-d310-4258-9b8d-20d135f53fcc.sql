-- Fix linter warnings: remove always-true RLS policies for write operations

-- analytics: public inserts must at least reference an existing company (and valid property if provided)
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
CREATE POLICY "Anyone can insert analytics"
ON public.analytics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = analytics.company_id
  )
  AND (
    analytics.property_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = analytics.property_id
        AND p.company_id = analytics.company_id
    )
  )
);

-- inquiries: public inserts must target a real company (and valid property if provided)
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = inquiries.company_id
  )
  AND (
    inquiries.property_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = inquiries.property_id
        AND p.company_id = inquiries.company_id
    )
  )
);

-- lead_tracking: avoid USING(true) on updates; restrict updates to rows tied to a valid company
DROP POLICY IF EXISTS "Anyone can update their own session tracking" ON public.lead_tracking;
CREATE POLICY "Anyone can update their own session tracking"
ON public.lead_tracking
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = lead_tracking.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = lead_tracking.company_id
  )
);

-- notifications/payments/subscriptions: "service role" policies must not be (true) for all roles
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
CREATE POLICY "Service role can manage notifications"
ON public.notifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');