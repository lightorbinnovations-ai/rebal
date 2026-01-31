import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CompanyButton
 * A strictly theme-aware button for public company pages.
 * Enforces:
 * - Light Mode: Primary Color Background
 * - Dark Mode: Secondary Color Background
 * 
 * Uses the custom tokens 'bg-button' and 'text-button-foreground' defined in index.css
 */
export const CompanyButton = ({ className, variant = "default", ...props }: ButtonProps) => {
    // Only enforce strict colors for the default (solid) variant
    // Outline/Ghost variants will inherit text color which is handled by text-primary class usually
    const strictClasses = variant === "default"
        ? "bg-button text-button-foreground hover:bg-button/90 dark:hover:bg-button/90 border-0"
        : "";

    return (
        <Button
            className={cn(strictClasses, className)}
            variant={variant === "default" ? "default" : variant}
            {...props}
        />
    );
};
