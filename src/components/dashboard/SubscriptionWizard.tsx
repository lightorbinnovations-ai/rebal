import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  Landmark, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Sparkles,
  Users,
  Briefcase,
  Store,
} from "lucide-react";

interface SubscriptionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  userId?: string;
}

type UserType = "landlord_agent" | "realtor" | "company" | null;
type PropertyVolume = "few" | "moderate" | "many" | null;
type BusinessScale = "personal" | "small_team" | "established" | null;

interface WizardState {
  userType: UserType;
  propertyVolume: PropertyVolume;
  businessScale: BusinessScale;
}

// Use a user-specific key to track wizard completion
const getWizardCompletedKey = (userId?: string) => `rebal_subscription_wizard_completed${userId ? `_${userId}` : ""}`;

export const SubscriptionWizard = ({ isOpen, onClose, onSelectPlan, userId }: SubscriptionWizardProps) => {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    userType: null,
    propertyVolume: null,
    businessScale: null,
  });
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Calculate recommendation
      calculateRecommendation();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateRecommendation = () => {
    let plan = "starter"; // Default to Starter

    // Company type = Business
    if (state.userType === "company") {
      plan = "business";
    }
    // Realtor
    else if (state.userType === "realtor") {
      // High volume or established = Pro
      if (state.propertyVolume === "many" || state.businessScale === "established") {
        plan = "pro";
      } else if (state.propertyVolume === "moderate" || state.businessScale === "small_team") {
        plan = "pro";
      } else {
        plan = "starter";
      }
    }
    // Landlord/Agent - mostly starter unless high volume
    else if (state.userType === "landlord_agent") {
      if (state.propertyVolume === "many" && state.businessScale === "established") {
        plan = "pro";
      } else {
        plan = "starter";
      }
    }

  setRecommendedPlan(plan);
    setStep(4); // Show recommendation
  };

  const handleComplete = (selectedPlan?: string) => {
    // Mark wizard as completed for this user
    localStorage.setItem(getWizardCompletedKey(userId), "true");
    
    if (selectedPlan && onSelectPlan) {
      onSelectPlan(selectedPlan);
    }
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return state.userType !== null;
      case 2:
        return state.propertyVolume !== null;
      case 3:
        return state.businessScale !== null;
      default:
        return true;
    }
  };

  const getPlanDetails = (planId: string) => {
    const plans: Record<string, { name: string; price: string; description: string; color: string }> = {
      starter: {
        name: "Starter",
        price: "₦3,000/mo",
        description: "Perfect for landlords and rental agents managing a few properties",
        color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
      },
      pro: {
        name: "Pro",
        price: "₦8,000/mo",
        description: "Ideal for realtors actively selling properties for clients",
        color: "text-primary bg-primary/10 border-primary/20",
      },
      business: {
        name: "Business",
        price: "₦20,000/mo",
        description: "Built for real estate companies with unlimited needs",
        color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      },
    };
    return plans[planId] || plans.starter;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Find Your Perfect Plan
          </DialogTitle>
          <DialogDescription>
            Answer a few questions to get a personalized recommendation
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {step <= totalSteps && (
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {/* Step 1: User Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What best describes your business?
            </p>
            <div className="grid gap-3">
              <OptionCard
                icon={Home}
                title="Landlord / Rental Agent"
                description="I manage rental properties for landlords or my own properties"
                selected={state.userType === "landlord_agent"}
                onClick={() => setState({ ...state, userType: "landlord_agent" })}
              />
              <OptionCard
                icon={Briefcase}
                title="Realtor / Property Seller"
                description="I sell properties for real estate developers and clients"
                selected={state.userType === "realtor"}
                onClick={() => setState({ ...state, userType: "realtor" })}
              />
              <OptionCard
                icon={Building2}
                title="Real Estate Company"
                description="We are an established company selling properties at scale"
                selected={state.userType === "company"}
                onClick={() => setState({ ...state, userType: "company" })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Property Volume */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How many properties do you typically handle at once?
            </p>
            <div className="grid gap-3">
              <OptionCard
                icon={Home}
                title="Just a few (1-5)"
                description="I handle a small number of properties at a time"
                selected={state.propertyVolume === "few"}
                onClick={() => setState({ ...state, propertyVolume: "few" })}
              />
              <OptionCard
                icon={Store}
                title="Moderate (6-20)"
                description="I regularly manage multiple active listings"
                selected={state.propertyVolume === "moderate"}
                onClick={() => setState({ ...state, propertyVolume: "moderate" })}
              />
              <OptionCard
                icon={Landmark}
                title="Many (20+)"
                description="I have a large portfolio of properties to manage"
                selected={state.propertyVolume === "many"}
                onClick={() => setState({ ...state, propertyVolume: "many" })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Business Scale */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How would you describe your business setup?
            </p>
            <div className="grid gap-3">
              <OptionCard
                icon={Users}
                title="Just Me"
                description="I work independently as a sole proprietor"
                selected={state.businessScale === "personal"}
                onClick={() => setState({ ...state, businessScale: "personal" })}
              />
              <OptionCard
                icon={Users}
                title="Small Team (2-5 people)"
                description="I work with a small team or partners"
                selected={state.businessScale === "small_team"}
                onClick={() => setState({ ...state, businessScale: "small_team" })}
              />
              <OptionCard
                icon={Building2}
                title="Established Business (5+)"
                description="We have an established company with multiple staff"
                selected={state.businessScale === "established"}
                onClick={() => setState({ ...state, businessScale: "established" })}
              />
            </div>
          </div>
        )}

        {/* Step 4: Recommendation */}
        {step === 4 && recommendedPlan && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                We recommend the {getPlanDetails(recommendedPlan).name} plan
              </h3>
              <p className="text-sm text-muted-foreground">
                {getPlanDetails(recommendedPlan).description}
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-xl border-2 text-center",
              getPlanDetails(recommendedPlan).color
            )}>
              <Badge variant="secondary" className="mb-2">Recommended</Badge>
              <h4 className="text-2xl font-bold mb-1">
                {getPlanDetails(recommendedPlan).name}
              </h4>
              <p className="text-lg font-semibold">
                {getPlanDetails(recommendedPlan).price}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="w-full shine-effect"
                onClick={() => handleComplete(recommendedPlan)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Continue with {getPlanDetails(recommendedPlan).name}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleComplete()}
              >
                I'll choose later
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step <= totalSteps && (
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={step === 1 ? () => handleComplete() : handleBack}
            >
              {step === 1 ? (
                "Skip"
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {step === totalSteps ? "See Recommendation" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Option Card Component
interface OptionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const OptionCard = ({ icon: Icon, title, description, selected, onClick }: OptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
      selected
        ? "border-primary bg-primary/5"
        : "border-border hover:border-primary/50 hover:bg-muted/50"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
      selected ? "bg-primary text-primary-foreground" : "bg-muted"
    )}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "font-medium",
        selected && "text-primary"
      )}>
        {title}
      </p>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
    {selected && (
      <Check className="h-5 w-5 text-primary flex-shrink-0" />
    )}
  </button>
);

// Hook to manage wizard visibility
export const useSubscriptionWizard = (userId: string | undefined) => {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if wizard was completed for this user
    const wizardCompleted = localStorage.getItem(getWizardCompletedKey(userId));
    
    // Show wizard for users who haven't completed it
    // Delay slightly so it doesn't compete with onboarding modal
    if (!wizardCompleted) {
      const timer = setTimeout(() => {
        setShowWizard(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const closeWizard = () => {
    localStorage.setItem(getWizardCompletedKey(userId), "true");
    setShowWizard(false);
  };

  const resetWizard = () => {
    localStorage.removeItem(getWizardCompletedKey(userId));
    setShowWizard(true);
  };

  return {
    showWizard,
    closeWizard,
    resetWizard,
    userId,
  };
};
