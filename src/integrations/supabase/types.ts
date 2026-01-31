export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_notifications_log: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          recipient: string
          status: string
          subject: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient: string
          status?: string
          subject: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient?: string
          status?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          company_id: string
          created_at: string
          event_type: string
          id: string
          property_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          event_type: string
          id?: string
          property_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          event_type?: string
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          api_key: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          api_key: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_type: string | null
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          button_style: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          font_body: string | null
          font_heading: string | null
          footer_bg_color: string | null
          footer_text_color: string | null
          hero_image_url: string | null
          id: string
          instagram: string | null
          is_verified: boolean
          last_email_confirmed_at: string | null
          linkedin: string | null
          logo_url: string | null
          max_properties: number | null
          name: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          phone: string | null
          primary_color: string | null
          profile_picture_url: string | null
          referral_code: string | null
          referred_by: string | null
          secondary_color: string | null
          slug: string
          subscription_end_date: string | null
          subscription_status: string | null
          tagline: string | null
          telegram: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          wallet_balance: number | null
          whatsapp: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean
          last_email_confirmed_at?: string | null
          linkedin?: string | null
          logo_url?: string | null
          max_properties?: number | null
          name: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          secondary_color?: string | null
          slug: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number | null
          whatsapp?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean
          last_email_confirmed_at?: string | null
          linkedin?: string | null
          logo_url?: string | null
          max_properties?: number | null
          name?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          secondary_color?: string | null
          slug?: string
          subscription_end_date?: string | null
          subscription_status?: string | null
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          company_id: string
          created_at: string
          domain: string
          help_notes: string | null
          help_requested: boolean | null
          help_requested_at: string | null
          id: string
          status: string
          updated_at: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          domain: string
          help_notes?: string | null
          help_requested?: boolean | null
          help_requested_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          domain?: string
          help_notes?: string | null
          help_requested?: boolean | null
          help_requested_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_email_requests: {
        Row: {
          admin_note: string | null
          company_id: string
          created_at: string
          domain_id: string | null
          forward_to_email: string
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_email: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          company_id: string
          created_at?: string
          domain_id?: string | null
          forward_to_email: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_email: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          company_id?: string
          created_at?: string
          domain_id?: string | null
          forward_to_email?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_email?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_email_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_email_requests_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "custom_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_email_requests_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "custom_domains_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_pricing: {
        Row: {
          created_at: string
          extension: string
          id: string
          is_available: boolean | null
          updated_at: string
          yearly_price: number
        }
        Insert: {
          created_at?: string
          extension: string
          id?: string
          is_available?: boolean | null
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          created_at?: string
          extension?: string
          id?: string
          is_available?: boolean | null
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
      }
      domain_requests: {
        Row: {
          activated_at: string | null
          admin_note: string | null
          business_name: string
          company_id: string
          created_at: string
          domain_price: number | null
          email_prefix: string | null
          email_price: number | null
          email_status: string | null
          forward_to_email: string | null
          id: string
          paid_at: string | null
          payment_reference: string | null
          price_set_at: string | null
          processed_by: string | null
          selected_domain: string | null
          selected_extension: string | null
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          admin_note?: string | null
          business_name: string
          company_id: string
          created_at?: string
          domain_price?: number | null
          email_prefix?: string | null
          email_price?: number | null
          email_status?: string | null
          forward_to_email?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          price_set_at?: string | null
          processed_by?: string | null
          selected_domain?: string | null
          selected_extension?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          admin_note?: string | null
          business_name?: string
          company_id?: string
          created_at?: string
          domain_price?: number | null
          email_prefix?: string | null
          email_price?: number | null
          email_status?: string | null
          forward_to_email?: string | null
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          price_set_at?: string | null
          processed_by?: string | null
          selected_domain?: string | null
          selected_extension?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_reverification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          last_activity_at: string | null
          lead_score: string | null
          message: string
          name: string
          page_views: number | null
          phone: string | null
          properties_viewed: number | null
          property_id: string | null
          status: string
          time_spent_seconds: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          last_activity_at?: string | null
          lead_score?: string | null
          message: string
          name: string
          page_views?: number | null
          phone?: string | null
          properties_viewed?: number | null
          property_id?: string | null
          status?: string
          time_spent_seconds?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          last_activity_at?: string | null
          lead_score?: string | null
          message?: string
          name?: string
          page_views?: number | null
          phone?: string | null
          properties_viewed?: number | null
          property_id?: string | null
          status?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tracking: {
        Row: {
          company_id: string
          created_at: string
          id: string
          page_views: number | null
          properties_viewed: string[] | null
          property_id: string | null
          session_id: string
          time_spent_seconds: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          page_views?: number | null
          properties_viewed?: string[] | null
          property_id?: string | null
          session_id: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          page_views?: number | null
          properties_viewed?: string[] | null
          property_id?: string | null
          session_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      nigerian_locations: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          id: string
          state: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          state: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          paystack_reference: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          paystack_reference: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          paystack_reference?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          company_id: string
          created_at: string
          description: string | null
          features: string[] | null
          gallery_urls: string[] | null
          id: string
          is_active: boolean
          keywords: string[] | null
          landmark: string | null
          location: string | null
          main_image_url: string | null
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          price: number
          priority_score: number | null
          property_type: string
          purpose: string
          slug: string
          state: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          gallery_urls?: string[] | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          landmark?: string | null
          location?: string | null
          main_image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          price: number
          priority_score?: number | null
          property_type: string
          purpose: string
          slug: string
          state?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          gallery_urls?: string[] | null
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          landmark?: string | null
          location?: string | null
          main_image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          price?: number
          priority_score?: number | null
          property_type?: string
          purpose?: string
          slug?: string
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      property_boosts: {
        Row: {
          admin_note: string | null
          amount_paid: number | null
          boost_score: number
          boost_type: string
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          property_id: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount_paid?: number | null
          boost_score?: number
          boost_type: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          property_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount_paid?: number | null
          boost_score?: number
          boost_type?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          property_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_boosts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_boosts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      public_company_profiles: {
        Row: {
          address: string | null
          button_style: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          font_body: string | null
          font_heading: string | null
          footer_bg_color: string | null
          footer_text_color: string | null
          hero_image_url: string | null
          id: string
          instagram: string | null
          is_verified: boolean
          linkedin: string | null
          logo_url: string | null
          name: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          phone: string | null
          primary_color: string | null
          profile_picture_url: string | null
          secondary_color: string | null
          slug: string
          tagline: string | null
          telegram: string | null
          twitter: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id: string
          instagram?: string | null
          is_verified?: boolean
          linkedin?: string | null
          logo_url?: string | null
          name: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          secondary_color?: string | null
          slug: string
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean
          linkedin?: string | null
          logo_url?: string | null
          name?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          secondary_color?: string | null
          slug?: string
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          payment_amount: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_amount: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_amount: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_amount?: number
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          referral_code: string
          referred_company_id: string | null
          referrer_company_id: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          referral_code: string
          referred_company_id?: string | null
          referrer_company_id?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          referral_code?: string
          referred_company_id?: string | null
          referrer_company_id?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_referred_company_id_fkey"
            columns: ["referred_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_referrer_company_id_fkey"
            columns: ["referrer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_visits: {
        Row: {
          converted_at: string | null
          converted_company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          referral_code: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referral_code: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referral_code?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_visits_converted_company_id_fkey"
            columns: ["converted_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          paid_at: string | null
          referred_id: string
          referrer_id: string
          reward_amount: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_id: string
          referrer_id: string
          reward_amount?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          email_notifications: boolean
          filters: Json
          id: string
          last_notified_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      short_links: {
        Row: {
          click_count: number
          company_id: string
          created_at: string
          full_path: string
          id: string
          property_id: string | null
          short_code: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          company_id: string
          created_at?: string
          full_path: string
          id?: string
          property_id?: string | null
          short_code: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          company_id?: string
          created_at?: string
          full_path?: string
          id?: string
          property_id?: string | null
          short_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "short_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_properties: number | null
          monthly_price: number
          name: string
          yearly_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          max_properties?: number | null
          monthly_price?: number
          name: string
          yearly_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_properties?: number | null
          monthly_price?: number
          name?: string
          yearly_price?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          failed_payment_count: number | null
          grace_period_end: string | null
          id: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan_id: string
          status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failed_payment_count?: number | null
          grace_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failed_payment_count?: number | null
          grace_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          company_id: string
          created_at: string
          id: string
          message: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          company_id: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          additional_info: string | null
          business_registration: string | null
          company_id: string
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          business_registration?: string | null
          company_id: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          business_registration?: string | null
          company_id?: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          company_id: string
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_name: string
          company_id: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          company_id?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      custom_domains_safe: {
        Row: {
          company_id: string | null
          created_at: string | null
          domain: string | null
          id: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_company_profiles_safe: {
        Row: {
          button_style: string | null
          created_at: string | null
          description: string | null
          facebook: string | null
          font_body: string | null
          font_heading: string | null
          footer_bg_color: string | null
          footer_text_color: string | null
          hero_image_url: string | null
          id: string | null
          instagram: string | null
          is_verified: boolean | null
          linkedin: string | null
          logo_url: string | null
          name: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          primary_color: string | null
          profile_picture_url: string | null
          secondary_color: string | null
          slug: string | null
          tagline: string | null
          telegram: string | null
          twitter: string | null
          updated_at: string | null
        }
        Insert: {
          button_style?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id?: string | null
          instagram?: string | null
          is_verified?: boolean | null
          linkedin?: string | null
          logo_url?: string | null
          name?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          secondary_color?: string | null
          slug?: string | null
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string | null
        }
        Update: {
          button_style?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_bg_color?: string | null
          footer_text_color?: string | null
          hero_image_url?: string | null
          id?: string | null
          instagram?: string | null
          is_verified?: boolean | null
          linkedin?: string | null
          logo_url?: string | null
          name?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          primary_color?: string | null
          profile_picture_url?: string | null
          secondary_color?: string | null
          slug?: string | null
          tagline?: string | null
          telegram?: string | null
          twitter?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_referral_commission: {
        Args: { p_amount: number; p_referred_id: string; p_referrer_id: string }
        Returns: undefined
      }
      add_to_wallet: {
        Args: { p_amount: number; p_company_id: string }
        Returns: undefined
      }
      check_contact_rate_limit: { Args: { p_email: string }; Returns: boolean }
      check_inquiry_rate_limit: {
        Args: { p_company_id: string; p_email: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      confirm_email_reverification: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_api_key_for_company: {
        Args: { p_company_id: string }
        Returns: string
      }
      expire_grace_periods: { Args: never; Returns: number }
      expire_old_boosts: { Args: never; Returns: number }
      generate_api_key: { Args: never; Returns: string }
      generate_short_code: { Args: never; Returns: string }
      get_public_company_by_id: {
        Args: { company_id: string }
        Returns: {
          button_style: string
          description: string
          facebook: string
          font_body: string
          font_heading: string
          footer_bg_color: string
          footer_text_color: string
          hero_image_url: string
          id: string
          instagram: string
          is_verified: boolean
          linkedin: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          tagline: string
          telegram: string
          twitter: string
        }[]
      }
      get_public_company_profile: {
        Args: { company_slug: string }
        Returns: {
          button_style: string
          description: string
          facebook: string
          font_body: string
          font_heading: string
          footer_bg_color: string
          footer_text_color: string
          hero_image_url: string
          id: string
          instagram: string
          is_verified: boolean
          linkedin: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          tagline: string
          telegram: string
          twitter: string
        }[]
      }
      get_public_company_profile_safe: {
        Args: { company_slug: string }
        Returns: {
          address: string
          button_style: string
          description: string
          email: string
          facebook: string
          font_body: string
          font_heading: string
          footer_bg_color: string
          footer_text_color: string
          hero_image_url: string
          id: string
          instagram: string
          is_verified: boolean
          linkedin: string
          logo_url: string
          name: string
          og_description: string
          og_image_url: string
          og_title: string
          phone: string
          primary_color: string
          profile_picture_url: string
          secondary_color: string
          slug: string
          tagline: string
          telegram: string
          twitter: string
          whatsapp: string
        }[]
      }
      get_user_email_for_admin: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_short_link_click: {
        Args: { p_short_code: string }
        Returns: {
          full_path: string
        }[]
      }
      is_subscription_active: {
        Args: { company_uuid: string }
        Returns: boolean
      }
      is_token_valid: {
        Args: { p_token: string; p_user_id: string }
        Returns: boolean
      }
      needs_email_reverification: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      search_public_properties: {
        Args: {
          p_city?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_property_type?: string
          p_purpose?: string
          p_search_query?: string
          p_state?: string
        }
        Returns: {
          area: string
          city: string
          company_id: string
          company_logo: string
          company_name: string
          company_slug: string
          company_verified: boolean
          created_at: string
          description: string
          features: string[]
          id: string
          main_image_url: string
          price: number
          priority_score: number
          property_type: string
          purpose: string
          slug: string
          state: string
          subscription_tier: string
          title: string
          total_count: number
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "moderator", "user"],
    },
  },
} as const
