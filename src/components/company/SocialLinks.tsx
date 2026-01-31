import { CompanyProfile } from "@/types/company";
import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, MessageCircle, Send } from "lucide-react";

interface SocialLinksProps {
  company: CompanyProfile;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SocialLinks = ({ company, size = "md", className }: SocialLinksProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      url: company.whatsapp ? `https://wa.me/${company.whatsapp.replace(/\D/g, "")}` : null,
      icon: MessageCircle,
      color: "hover:bg-green-500 hover:text-white",
    },
    {
      name: "Telegram",
      url: company.telegram ? `https://t.me/${company.telegram.replace("@", "")}` : null,
      icon: Send,
      color: "hover:bg-blue-500 hover:text-white",
    },
    {
      name: "Facebook",
      url: company.facebook,
      icon: Facebook,
      color: "hover:bg-blue-600 hover:text-white",
    },
    {
      name: "Instagram",
      url: company.instagram,
      icon: Instagram,
      color: "hover:bg-pink-500 hover:text-white",
    },
    {
      name: "LinkedIn",
      url: company.linkedin,
      icon: Linkedin,
      color: "hover:bg-blue-700 hover:text-white",
    },
    {
      name: "X (Twitter)",
      url: company.twitter,
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconSizes[size]}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
    },
  ];

  const availableLinks = socialLinks.filter((link) => link.url);

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {availableLinks.map((link) => (
        <a
          key={link.name}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200",
            sizeClasses[size],
            link.color
          )}
          title={link.name}
        >
          <link.icon className={iconSizes[size]} />
        </a>
      ))}
    </div>
  );
};
