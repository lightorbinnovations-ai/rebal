import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Hammer } from "lucide-react";
import { AppLoader } from "@/components/ui/AppLoader";

export const MaintenanceGuard = () => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    // Allow admin routes even in maintenance mode
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isAuthRoute = location.pathname.startsWith("/auth") || location.pathname.startsWith("/admin/login");

    useEffect(() => {
        const checkMaintenanceMode = async () => {
            try {
                const { data, error } = await supabase
                    .from("platform_settings")
                    .select("value")
                    .eq("key", "maintenance_mode")
                    .maybeSingle();

                if (!error && data) {
                    setIsMaintenanceMode(data.value === true || data.value === "true");
                }
            } catch (error) {
                console.error("Error checking maintenance mode:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkMaintenanceMode();
    }, []);

    if (isLoading) {
        return <AppLoader />;
    }

    if (isMaintenanceMode && !isAdminRoute && !isAuthRoute) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative bg-muted p-6 rounded-full shadow-xl border border-border/50">
                        <Hammer className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="space-y-4 max-w-lg">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                        Under Maintenance
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        We are currently performing scheduled maintenance to improve our platform.
                        We should be back shortly. Thank you for your patience.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Admin access remains available</span>
                </div>
            </div>
        );
    }

    return <Outlet />;
};
