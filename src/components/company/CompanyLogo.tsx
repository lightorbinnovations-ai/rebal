import { CompanyProfile } from "@/types/company";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  company: CompanyProfile;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CompanyLogo = ({ company, size = "md", className }: CompanyLogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-16 w-16 text-2xl",
  };

  // If company has a logo, display it
  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={`${company.name} logo`}
        className={cn(
          "object-contain rounded-lg",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  // Generate text-based logo from company name
  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};
