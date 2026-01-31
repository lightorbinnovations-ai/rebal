/**
 * Application-wide constants
 * Centralizes contact info and other shared values
 */

// Contact Information
export const CONTACT = {
  EMAIL: "rebalpros@gmail.com",
  PHONE: "+234 802 510 0844",
  PHONE_RAW: "+2348025100844",
  ADDRESS: "FCT, Abuja, Nigeria",
  WHATSAPP: "+2348025100844",
} as const;

// Company Information
export const COMPANY = {
  NAME: "REBAL",
  FULL_NAME: "REBAL Pro",
  TAGLINE: "One Smart Link for Your Property Business",
  PARENT_COMPANY: "LightOrb Innovations",
  WEBSITE: "https://rebal.site",
} as const;

// Base URL - uses current origin for dev, production domain for SEO/sharing
export const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : "https://rebal.site";

// Support Email
export const SUPPORT_EMAIL = "rebalpros@gmail.com";

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  FREE_TRIAL_DAYS: 14,
  FREE_PROPERTIES: 1,
  STARTER_PROPERTIES: 10,
  PRO_PROPERTIES: 50,
  BUSINESS_PROPERTIES: Infinity, // Unlimited
} as const;

// Rate Limits
export const RATE_LIMITS = {
  CONTACT_PER_HOUR: 3,
  INQUIRY_PER_HOUR: 5,
  PAGE_VIEWS_PER_UPDATE: 20,
  TIME_INCREMENT_SECONDS: 3600,
} as const;

// Input Limits
export const INPUT_LIMITS = {
  NAME_MAX: 100,
  EMAIL_MAX: 255,
  MESSAGE_MAX: 2000,
  PHONE_MAX: 20,
  DESCRIPTION_MAX: 5000,
} as const;
