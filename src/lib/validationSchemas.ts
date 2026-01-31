import { z } from "zod";

/**
 * Shared validation schemas for public-facing forms
 * Provides consistent validation with clear error messages
 */

// Contact/Inquiry form schema
export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
  property_id: z
    .string()
    .uuid("Invalid property ID")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s\-()]*$/, "Phone number contains invalid characters")
    .optional()
    .or(z.literal("")),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;

// Helper function to sanitize form data before API submission
export function sanitizeInquiryData(data: InquiryFormValues) {
  return {
    name: data.name.trim().substring(0, 100),
    email: data.email.trim().toLowerCase().substring(0, 255),
    message: data.message.trim().substring(0, 2000),
    property_id: data.property_id && data.property_id.length > 0 ? data.property_id : undefined,
    phone: data.phone?.trim().substring(0, 20) || undefined,
  };
}

// URL encoding helper for social share links
export function encodeShareText(text: string): string {
  return encodeURIComponent(text.substring(0, 500));
}

export function encodeShareUrl(url: string): string {
  return encodeURIComponent(url.substring(0, 2000));
}
