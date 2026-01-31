import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail } from "lucide-react";

interface EmailStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onNext: () => void;
  isLoading: boolean;
  showLastUsed?: boolean;
}

export const EmailStep = ({ email, onEmailChange, onNext, isLoading, showLastUsed }: EmailStepProps) => {
  const [error, setError] = useState("");

  const handleNext = () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check for common invalid patterns
    if (trimmedEmail.includes("..") || trimmedEmail.startsWith(".") || trimmedEmail.endsWith(".")) {
      setError("Please enter a valid email address");
      return;
    }
    
    setError("");
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {showLastUsed && (
          <div className="absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
            Last used
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={handleKeyDown}
              className="pl-10 h-12"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full h-12"
        onClick={handleNext}
        disabled={isLoading || !email}
      >
        Next
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};
