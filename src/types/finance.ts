export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned';
export type SubscriptionStatus = 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due';
export type BillingInterval = 'monthly' | 'yearly';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Payment {
    id: string;
    company_id: string;
    subscription_id?: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paystack_reference: string;
    payment_method?: string | null;
    paid_at?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
}

export interface Subscription {
    id: string;
    company_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    billing_interval?: BillingInterval;
    paystack_subscription_code?: string | null;
    paystack_customer_code?: string | null;
    current_period_start?: string | null;
    current_period_end?: string | null;
    trial_end?: string | null;
    grace_period_end?: string | null;
    failed_payment_count?: number;
    created_at: string;
    updated_at: string;
}

export interface WithdrawalRequest {
    id: string;
    company_id: string;
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    status: WithdrawalStatus;
    admin_note?: string | null;
    processed_by?: string | null;
    processed_at?: string | null;
    created_at: string;
    updated_at: string;
}

// For use in Admin Views where joins are common
export interface PaymentWithCompany extends Payment {
    company?: {
        name: string;
        slug: string;
    };
}

export interface SubscriptionWithCompany extends Subscription {
    company?: {
        name: string;
    };
}
