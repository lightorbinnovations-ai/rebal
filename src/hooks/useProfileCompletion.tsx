import { useMemo } from "react";
import type { Company } from "@/types/company";

export interface ProfileCompletionStatus {
  // Required for basic setup
  hasBusinessName: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;

  // Required for public site to be shareable
  hasTagline: boolean;
  hasDescription: boolean;

  // Computed statuses
  isBasicProfileComplete: boolean;
  isSiteShareable: boolean;
  canAddProperties: boolean;

  // Progress
  completionPercentage: number;
  missingBasicFields: string[];
  missingSiteFields: string[];
}

export const useProfileCompletion = (company: Company | null): ProfileCompletionStatus => {
  return useMemo(() => {
    if (!company) {
      return {
        hasBusinessName: false,
        hasPhone: false,
        hasEmail: false,
        hasAddress: false,
        hasTagline: false,
        hasDescription: false,
        isBasicProfileComplete: false,
        isSiteShareable: false,
        canAddProperties: false,
        completionPercentage: 0,
        missingBasicFields: ["Business Name", "Phone Number", "Email", "Address"],
        missingSiteFields: ["Tagline", "About Business"],
      };
    }

    const hasBusinessName = Boolean(company.name && company.name.trim().length > 0);
    const hasPhone = Boolean(company.phone && company.phone.trim().length > 0);
    const hasEmail = Boolean(company.email && company.email.trim().length > 0);
    const hasAddress = Boolean(company.address && company.address.trim().length > 0);
    const hasTagline = Boolean(company.tagline && company.tagline.trim().length > 0);
    const hasDescription = Boolean(company.description && company.description.trim().length > 0);
    const hasServices = Boolean(company.services && company.services.length > 0);

    // Basic profile is complete when all required fields are filled
    const isBasicProfileComplete = hasBusinessName && hasPhone && hasEmail && hasAddress;

    // Site is shareable when basic profile + tagline + description + services are complete
    const isSiteShareable = isBasicProfileComplete && hasTagline && hasDescription && hasServices;

    // Can add properties only when site is shareable (all setup is complete)
    const canAddProperties = isSiteShareable;

    // Calculate missing fields
    const missingBasicFields: string[] = [];
    if (!hasBusinessName) missingBasicFields.push("Business Name");
    if (!hasPhone) missingBasicFields.push("Phone Number");
    if (!hasEmail) missingBasicFields.push("Business Email");
    if (!hasAddress) missingBasicFields.push("Address");

    const missingSiteFields: string[] = [];
    if (!hasTagline) missingSiteFields.push("Tagline");
    if (!hasDescription) missingSiteFields.push("About Business");
    if (!hasServices) missingSiteFields.push("Services");

    // Calculate completion percentage (7 fields total)
    const totalFields = 7;
    const completedFields = [
      hasBusinessName,
      hasPhone,
      hasEmail,
      hasAddress,
      hasTagline,
      hasDescription,
      hasServices
    ].filter(Boolean).length;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      hasBusinessName,
      hasPhone,
      hasEmail,
      hasAddress,
      hasTagline,
      hasDescription,
      isBasicProfileComplete,
      isSiteShareable,
      canAddProperties,
      completionPercentage,
      missingBasicFields,
      missingSiteFields,
    };
  }, [company]);
};

// Helper to get a user-friendly message about what's missing
export const getProfileCompletionMessage = (status: ProfileCompletionStatus): string => {
  if (!status.isBasicProfileComplete) {
    return `Please complete your profile: ${status.missingBasicFields.join(", ")}`;
  }
  if (!status.isSiteShareable) {
    return `Add ${status.missingSiteFields.join(" and ")} to make your site shareable`;
  }
  return "Your profile is complete!";
};
