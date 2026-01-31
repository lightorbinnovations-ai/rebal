// Public company profile - safe fields only (no sensitive data)
// Note: This is used by real estate companies, realtors, marketers, and affiliate marketers
export interface CompanyProfile {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  hero_image_url?: string;
  profile_picture_url?: string; // Personal photo for about page
  // Contact info (public)
  phone?: string;
  email?: string;
  address?: string;
  // Social links
  // Social links (flat fields)
  whatsapp?: string;
  telegram?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;

  // Computed for UI
  social_links?: Record<string, string>;

  is_verified: boolean;
  // Custom Branding
  primary_color?: string | null;
  secondary_color?: string | null;
  font_heading?: string | null;
  font_body?: string | null;
  button_style?: string | null;
  footer_bg_color?: string | null;
  footer_text_color?: string | null;
  // Open Graph / Social sharing
  og_title?: string;
  og_description?: string;
  og_image_url?: string | null;
  // Personal Info
  personal_bio?: string | null;
  // Custom Domain
  custom_domain?: string | null;
  // Services
  services?: string[];
}

// Account type for distinguishing user types
export type AccountType = 'realtor' | 'affiliate';

// Full company data - for authenticated owner access only
export interface Company extends CompanyProfile {
  user_id: string;
  created_at: string;
  updated_at: string;
  // Account type
  account_type?: AccountType;
  // Referral fields
  referral_code?: string;
  referred_by?: string;
  wallet_balance?: number;
  // Subscription fields
  subscription_status?: 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due';
  subscription_end_date?: string;
  max_properties?: number;
  // Bank details for withdrawals
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  // Onboarding
  onboarding_completed?: boolean;
}

export interface RealtorStats {
  id: string;
  user_id: string;
  company_id: string;
  years_experience: number;
  satisfaction_rate: number;
  active_listings?: number;
  total_applicants?: number;
  created_at: string;
  updated_at: string;
}

export type PropertyStatus = 'Available' | 'Sold' | 'Reserved' | 'Under Offer';

export interface Property {
  id: string;
  company_id: string;
  slug: string;
  title: string;
  property_type: string;
  purpose: string;
  price: number;
  description?: string;
  features?: string[];
  main_image_url?: string;
  gallery_urls?: string[];
  location?: string;
  address?: string;
  state?: string;
  city?: string;
  area?: string;
  status: PropertyStatus;
  is_active: boolean;
  priority_score?: number;
  created_at: string;
  updated_at: string;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  // Open Graph / Social sharing
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  video_url?: string;
}

export type InquiryStatus = 'New' | 'Viewed' | 'Responded';

export interface Inquiry {
  id: string;
  company_id: string;
  property_id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export type ReferralStatus = 'pending' | 'completed' | 'paid';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus;
  reward_amount: number;
  created_at: string;
  paid_at?: string;
  // Joined fields
  referred_company?: {
    name: string;
    slug: string;
    created_at: string;
  };
}
