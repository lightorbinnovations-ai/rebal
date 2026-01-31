import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AuthCard,
  GoogleSignInButton,
  EmailStep,
  PasswordStep,
  AuthDivider,
  ReferralBadge,
  AuthFeatures,
  SelectedPlanBadge,
} from "@/components/auth";

type AuthStep = "initial" | "password";
type AuthMethod = "google" | "email" | null;
type AuthMode = "signin" | "signup";

// Local storage keys
const LAST_AUTH_METHOD_KEY = "rebal_last_auth_method";
const LAST_EMAIL_KEY = "rebal_last_email";

// Generate a simple browser fingerprint for referral attribution
const generateFingerprint = (): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint", 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvasData.substring(0, 50),
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Auth state
  const [step, setStep] = useState<AuthStep>("initial");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Last used method tracking
  const [lastUsedMethod, setLastUsedMethod] = useState<AuthMethod>(null);
  const [lastUsedEmail, setLastUsedEmail] = useState<string | null>(null);

  // Referral state
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const hasTrackedVisit = useRef(false);

  const referralCode = searchParams.get("ref");
  const selectedPlanId = searchParams.get("plan");
  const selectedInterval = searchParams.get("interval");

  // Load last used method on mount
  useEffect(() => {
    const savedMethod = localStorage.getItem(LAST_AUTH_METHOD_KEY) as AuthMethod;
    const savedEmail = localStorage.getItem(LAST_EMAIL_KEY);

    if (savedMethod) {
      setLastUsedMethod(savedMethod);
    }
    if (savedEmail) {
      setLastUsedEmail(savedEmail);
      setEmail(savedEmail);
    }
  }, []);

  // Save last used method
  const saveLastUsedMethod = useCallback((method: AuthMethod, userEmail?: string) => {
    if (method) {
      localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
    }
    if (userEmail) {
      localStorage.setItem(LAST_EMAIL_KEY, userEmail);
    }
  }, []);

  // Track referral visit
  const trackReferralVisit = useCallback((code: string) => {
    const fingerprint = generateFingerprint();
    localStorage.setItem("visitor_fingerprint", fingerprint);

    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");

    supabase.functions
      .invoke("track-referral", {
        body: {
          action: "visit",
          referral_code: code,
          visitor_fingerprint: fingerprint,
          landing_page: window.location.pathname,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
      })
      .then((response) => {
        if (response.data?.referrer_name) {
          setReferrerName(response.data.referrer_name);
        }
        console.log("[Referral] Visit tracked:", response.data);
      })
      .catch((error) => {
        console.error("[Referral] Failed to track visit:", error);
      });
  }, [searchParams]);

  // Handle referral code and auth state
  useEffect(() => {
    // Store referral code if present
    if (referralCode) {
      localStorage.setItem("referral_code", referralCode);
      console.log("[Referral] Stored referral code:", referralCode);

      if (!hasTrackedVisit.current) {
        hasTrackedVisit.current = true;
        trackReferralVisit(referralCode);
      }
    }

    // Check for existing session
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[Auth] Session check error:", error);
        return;
      }

      if (session) {
        console.log("[Auth] Existing session found, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Auth state changed:", event);

      if (event === "SIGNED_IN" && session) {
        console.log("[Auth] SIGNED_IN event received, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, referralCode, trackReferralVisit]);

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError("");

    try {
      // Ensure referral code is stored
      const refCode = referralCode || localStorage.getItem("referral_code");
      if (refCode) {
        localStorage.setItem("referral_code", refCode);
      }

      const redirectUrl = `${window.location.origin}/dashboard`;

      console.log("[Auth] Starting Google OAuth with redirect:", redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        setAuthError(error.message);
      } else {
        // Save method before redirect
        saveLastUsedMethod("google");
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email next step
  const handleEmailNext = async () => {
    setAuthError("");

    // Check if user exists to determine sign in vs sign up
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    // If error contains "User not found", it's a new user
    if (error?.message?.includes("User not found") || error?.message?.includes("Signups not allowed")) {
      setMode("signup");
    } else {
      setMode("signin");
    }

    setStep("password");
  };

  // Handle password submit
  const handlePasswordSubmit = async () => {
    setIsLoading(true);
    setAuthError("");

    try {
      if (mode === "signup") {
        // Sign up
        const redirectUrl = `${window.location.origin}/dashboard`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            setAuthError("This email is already registered. Please sign in instead.");
            setMode("signin");
          } else {
            setAuthError(error.message);
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        if (data.user) {
          saveLastUsedMethod("email", email);
          // Check if email confirmation is required
          if (data.user.identities && data.user.identities.length === 0) {
            // User already exists but is unconfirmed
            toast({
              title: "Check your email",
              description: "A confirmation link has been sent. Please verify your email to continue.",
            });
          } else if (!data.session) {
            // Email confirmation required
            toast({
              title: "Check your email! 📧",
              description: "We've sent you a confirmation link. Click it to verify your email and complete signup.",
            });
          } else {
            toast({
              title: "Account created!",
              description: "Welcome to REBAL. Setting up your account...",
            });
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setAuthError("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            setAuthError("Please verify your email before signing in.");
          } else {
            setAuthError(error.message);
          }
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          saveLastUsedMethod("email", email);
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
      toast({
        title: mode === "signup" ? "Sign up failed" : "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email first");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reset link sent! 📧",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      if (error.message?.includes("security purposes") || error.status === 429) {
        toast({
          title: "Check your email",
          description: "A reset link was already sent recently. Please check your inbox.",
        });
        setAuthError("");
      } else {
        toast({
          title: "Failed to send reset link",
          description: error.message,
          variant: "destructive",
        });
        setAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to email step
  const handleBack = () => {
    setStep("initial");
    setPassword("");
    setAuthError("");
  };

  // Toggle between sign in and sign up
  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setAuthError("");
  };

  return (
    <div className="min-h-screen flex flex-col p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient opacity-30" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl floating-element" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl floating-element-delayed" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Back to Home - Now in document flow */}
      <div className="relative z-10 pt-2">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link
              to="/"
              className="inline-block text-3xl font-extrabold font-heading text-foreground"
            >
              REBAL
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
                {step === "initial"
                  ? "Welcome to REBAL"
                  : mode === "signup"
                    ? "Create your account"
                    : "Welcome back"
                }
              </h1>
              <p className="text-muted-foreground">
                {step === "initial"
                  ? "Sign in with Google or enter your email to continue."
                  : mode === "signup"
                    ? "Choose a password to complete your account."
                    : "Enter your password to sign in."
                }
              </p>
            </div>
            <ReferralBadge referralCode={referralCode} referrerName={referrerName} />
            <SelectedPlanBadge planId={selectedPlanId} interval={selectedInterval} />
          </div>

          {/* Auth Card */}
          <AuthCard
            title={step === "initial" ? "Get Started" : mode === "signup" ? "Almost there" : "Sign in"}
            description={
              step === "initial"
                ? "Sign in or create an account"
                : mode === "signup"
                  ? "Create a password to secure your account"
                  : "Enter your password to continue"
            }
          >
            {step === "initial" ? (
              <>
                {/* Google Sign In - Primary */}
                <GoogleSignInButton
                  onClick={handleGoogleSignIn}
                  isLoading={isLoading}
                  showLastUsed={lastUsedMethod === "google"}
                />

                <AuthDivider />

                {/* Email Step */}
                <EmailStep
                  email={email}
                  onEmailChange={setEmail}
                  onNext={handleEmailNext}
                  isLoading={isLoading}
                  showLastUsed={lastUsedMethod === "email"}
                />
              </>
            ) : (
              <>
                {/* Password Step */}
                <PasswordStep
                  email={email}
                  password={password}
                  onPasswordChange={setPassword}
                  onBack={handleBack}
                  onSubmit={handlePasswordSubmit}
                  onForgotPassword={handleForgotPassword}
                  isLoading={isLoading}
                  isSignUp={mode === "signup"}
                  error={authError}
                />

                {/* Toggle sign in/sign up */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {mode === "signup"
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>
              </>
            )}

            {/* Security Note */}
            <p className="text-center text-xs text-muted-foreground pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is protected with enterprise-grade security.
            </p>
          </AuthCard>

          {/* Features */}
          <AuthFeatures />
        </div>
      </div>
    </div>
  );
};

export default Auth;
