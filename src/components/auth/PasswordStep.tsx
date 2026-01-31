import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";

interface PasswordStepProps {
  email: string;
  password: string;
  onPasswordChange: (password: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  isSignUp: boolean;
  error?: string;
}

export const PasswordStep = ({
  email,
  password,
  onPasswordChange,
  onBack,
  onSubmit,
  onForgotPassword,
  isLoading,
  isSignUp,
  error,
}: PasswordStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = () => {
    if (!password) {
      setLocalError("Please enter your password");
      return;
    }
    
    if (isSignUp && password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    
    setLocalError("");
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-4">
      {/* Email display with back button */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground truncate flex-1">{email}</span>
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          {isSignUp ? "Create a password" : "Password"}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
            value={password}
            onChange={(e) => {
              onPasswordChange(e.target.value);
              if (localError) setLocalError("");
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 h-12"
            disabled={isLoading}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {isSignUp && (
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters
          </p>
        )}
        {displayError && (
          <p className="text-sm text-destructive">{displayError}</p>
        )}
      </div>

      <Button
        type="button"
        className="w-full h-12"
        onClick={handleSubmit}
        disabled={isLoading || !password}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isSignUp ? "Create account" : "Sign in"}
      </Button>

      {/* Forgot password link - only shown for sign in */}
      {!isSignUp && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>
      )}
    </div>
  );
};
