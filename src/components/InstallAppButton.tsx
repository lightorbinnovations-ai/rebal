import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export const InstallAppButton = () => {
    const { isInstallable, promptInstall } = useInstallPrompt();
    // Force show in development for visual verification
    const isDev = import.meta.env.MODE === 'development';

    if (!isInstallable && !isDev) return null;

    return (
        <Button
            onClick={isInstallable ? promptInstall : () => alert("This is a preview button. In production, this only appears on installable devices (Android/Chrome).")}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse shadow-lg"
            size="lg"
        >
            <Download className="h-5 w-5" />
            Download App
        </Button>
    );
};
