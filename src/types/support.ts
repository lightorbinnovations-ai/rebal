export type SupportTicketStatus = 'open' | 'closed' | 'pending' | 'resolved';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface SupportTicket {
    id: string;
    user_id: string;
    company_id: string;
    subject: string;
    message: string;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
    admin_response?: string | null;
    responded_by?: string | null;
    responded_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    message: string;
    status?: ContactMessageStatus;
    created_at: string;
}
