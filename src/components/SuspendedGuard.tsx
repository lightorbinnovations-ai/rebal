import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Ban, LifeBuoy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const SuspendedGuard = () => {
    const [isSuspended, setIsSuspended] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkSuspension = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("companies")
                    .select("is_suspended")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (!error && data) {
                    setIsSuspended(data.is_suspended);
                }
            } catch (error) {
                console.error("Error checking suspension:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSuspension();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/auth";
    };

    if (isLoading) return null; // Or a loader

    if (isSuspended) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background animate-in fade-in duration-500">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="relative mx-auto">
                        <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                        <div className="relative bg-background p-6 rounded-full shadow-xl border-2 border-destructive/20 w-24 h-24 mx-auto flex items-center justify-center">
                            <Ban className="h-12 w-12 text-destructive" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                            Account Suspended
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Your account has been suspended due to a violation of our terms of service or suspicious activity.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-muted/50 border border-border/50 text-left space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <LifeBuoy className="h-4 w-4" /> What can I do?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            If you believe this is a mistake, please contact our support team immediately. We will review your case within 24 hours.
                        </p>
                        <Button className="w-full" asChild>
                            <a href="mailto:support@rebal.com">Contact Support</a>
                        </Button>
                    </div>

                    <Button variant="ghost" className="text-muted-foreground" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </Button>
                </div>
            </div>
        );
    }

    return <Outlet />;
};
