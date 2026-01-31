import { useState } from "react";
import {
    Building2,
    ArrowRight,
    CheckCircle2,
    Briefcase,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface AffiliateUpgradeCardProps {
    company: Company;
    onUpgrade: () => void;
}

export const AffiliateUpgradeCard = ({ company, onUpgrade }: AffiliateUpgradeCardProps) => {
    const { toast } = useToast();
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        try {
            const { error } = await supabase
                .from("companies")
                .update({ account_type: "realtor" })
                .eq("id", company.id);

            if (error) throw error;

            toast({
                title: "Account Upgraded! 🎉",
                description: "You are now a Realtor. You can start listing properties immediately.",
            });

            onUpgrade();
            // Reload to ensure all contexts update properly
            window.location.reload();
        } catch (error: any) {
            toast({
                title: "Upgrade Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    if (company.account_type === "realtor") return null;

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Become a Realtor
                </CardTitle>
                <CardDescription>
                    Upgrade your account to start listing properties and get your own website.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Create property listings</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Get a personalized website</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Manage inquiries and leads</span>
                        </li>
                    </ul>
                    <div className="bg-background/50 p-4 rounded-lg text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">
                            What happens to my affiliate data?
                        </p>
                        <p>
                            Don't worry! Your wallet balance, referral history, and earnings will be
                            preserved. You'll still be able to refer others and earn commissions.
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full sm:w-auto" disabled={isUpgrading}>
                            {isUpgrading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Briefcase className="mr-2 h-4 w-4" />
                            )}
                            Upgrade to Realtor Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Upgrade to Realtor Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will unlock property management features. You'll keep your existing
                                affiliate earnings and referrals.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUpgrade}>
                                Yes, Upgrade Me
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
};
