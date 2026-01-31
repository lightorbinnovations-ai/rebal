import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Rocket, Crown, Star, Loader2, CheckCircle2, Clock, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";
import { useBoostPayment } from "@/hooks/useBoostPayment";

interface PropertyBoostRequestProps {
  propertyId: string;
  propertyTitle: string;
  companyId: string;
  currentPriorityScore: number;
  subscriptionTier: string;
}

const BOOST_PRICE_PER_DAY = 1000; // ₦1,000 per day
const MIN_DAYS = 1;
const MAX_DAYS = 30;

export const PropertyBoostRequest = ({
  propertyId,
  propertyTitle,
  companyId,
  currentPriorityScore,
  subscriptionTier,
}: PropertyBoostRequestProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [activeBoost, setActiveBoost] = useState<{
    status: string;
    expires_at: string | null;
    boost_type: string;
  } | null>(null);

  const { isProcessing, redirectToBoostPayment } = useBoostPayment();

  // Determine tier capabilities (checking both old and new plan names)
  const tier = (subscriptionTier || "").toLowerCase();

  const isPremiumOrPro = tier === "premium" || tier === "pro" || tier === "business";
  const isBusiness = tier === "business" || tier === "premium";

  // Explicitly allow starter, pro, business, and premium
  const canBoost =
    tier === "starter" ||
    tier === "pro" ||
    tier === "business" ||
    tier === "premium";

  const isFreeOrTrial = !canBoost;
  const totalPrice = days * BOOST_PRICE_PER_DAY;

  const checkActiveBoost = async () => {
    const { data } = await supabase
      .from("property_boosts")
      .select("status, expires_at, boost_type")
      .eq("property_id", propertyId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setActiveBoost(data);
    }
  };

  useEffect(() => {
    checkActiveBoost();
  }, [propertyId]);

  const handleFreeBoost = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase.from("property_boosts").insert({
        property_id: propertyId,
        company_id: companyId,
        boost_type: "tier_included",
        status: "active",
        boost_score: 10,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid: 0,
      });

      if (error) throw error;

      // Trigger property update to recalculate priority
      await supabase
        .from("properties")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", propertyId);

      toast.success("Boost activated! Your property is now featured.");
      setIsOpen(false);
      await checkActiveBoost();
    } catch (error) {
      console.error("Boost error:", error);
      toast.error("Failed to activate boost");
    }
  };

  const handlePaidBoost = async () => {
    await redirectToBoostPayment({
      propertyId,
      days,
    });
  };

  // Business tier - already at top, no boost needed
  if (isBusiness) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-primary">
                Maximum Priority
              </p>
              <p className="text-sm text-muted-foreground">
                Business tier properties are always shown first
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free/Trial users cannot boost
  if (isFreeOrTrial) {
    return (
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Rocket className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">
                Boost Not Available
              </p>
              <p className="text-sm text-muted-foreground">
                Upgrade to Starter or higher to boost properties
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeBoost?.status === "active") {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Boost Active
              </p>
              {activeBoost.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Expires {new Date(activeBoost.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeBoost?.status === "pending") {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-400">
                Payment Pending
              </p>
              <p className="text-sm text-muted-foreground">
                Complete your payment to activate boost
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Rocket className="h-4 w-4" />
          Boost Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Boost "{propertyTitle}"
          </DialogTitle>
          <DialogDescription>
            Feature this property at the top of search results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isPremiumOrPro && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Premium Benefit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                As a premium subscriber, you can boost properties for free!
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Boost Duration</Label>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {days} {days === 1 ? "day" : "days"}
              </Badge>
            </div>

            <Slider
              value={[days]}
              onValueChange={([value]) => setDays(value)}
              min={MIN_DAYS}
              max={MAX_DAYS}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_DAYS} day</span>
              <span>{MAX_DAYS} days</span>
            </div>
          </div>

          {!isPremiumOrPro && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Price per day</span>
                <span className="font-medium">₦{BOOST_PRICE_PER_DAY.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₦{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              What you get
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Priority placement at the top of search results
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                Higher visibility than non-boosted properties
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                More inquiries and faster sales
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Boosted properties appear above non-boosted listings. Premium/Business tier subscribers still get highest priority.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
          {isPremiumOrPro ? (
            <Button onClick={handleFreeBoost} disabled={isProcessing} className="flex-1 gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Crown className="h-4 w-4" />
              Activate Free Boost
            </Button>
          ) : (
            <Button onClick={handlePaidBoost} disabled={isProcessing} className="flex-1 gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              <CreditCard className="h-4 w-4" />
              Pay ₦{totalPrice.toLocaleString()}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
