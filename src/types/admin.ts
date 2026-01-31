export interface AdminStats {
  totalUsers: number;
  totalCompanies: number;
  totalProperties: number;
  totalInquiries: number;
  totalReferrals: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  referred_by?: string | null;
  status: "active" | "suspended";
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
  properties_count: number;
  status: "active" | "hidden" | "suspended";
}

export interface AdminProperty {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  purpose: string;
  price: number;
  location: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AdminReferral {
  id: string;
  referrer: {
    id: string;
    name: string;
    slug: string;
  };
  referred: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  reward_amount: number;
  created_at: string;
  paid_at: string | null;
}

export interface PlatformSettings {
  platform_name: string;
  logo_url: string | null;
  social_links: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  footer_info: {
    email: string;
    phone: string;
    address: string;
  };
  maintenance_mode: boolean;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
