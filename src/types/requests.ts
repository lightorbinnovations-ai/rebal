export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export interface VerificationRequest {
    id: string;
    company_id: string;
    business_registration?: string | null;
    additional_info?: string | null;
    status: RequestStatus;
    rejection_reason?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface DomainRequest {
    id: string;
    company_id: string;
    business_name: string;
    selected_domain?: string | null;
    selected_extension?: string | null;
    domain_price?: number | null;
    email_price?: number | null;
    total_price?: number | null;
    status: RequestStatus;
    admin_note?: string | null;
    email_prefix?: string | null;
    forward_to_email?: string | null;
    email_status?: string | null;
    paid_at?: string | null;
    price_set_at?: string | null;
    activated_at?: string | null;
    processed_by?: string | null;
    created_at: string;
    updated_at?: string;
}
