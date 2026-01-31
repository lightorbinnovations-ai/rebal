import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MFASetup } from "@/components/admin/MFASetup";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
}

const defaultSettings: PlatformSettings = {
  platformName: "REBAL",
  maintenanceMode: false,
};

export default function AdminSettings() {
  const { signOut, isLoading: authLoading, user } = useAdminAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);

  // Load settings from platform_settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["platform_name", "maintenance_mode"]);

        if (error) throw error;

        if (data && data.length > 0) {
          const newSettings = { ...defaultSettings };
          data.forEach((item) => {
            if (item.key === "platform_name" && item.value) {
              newSettings.platformName = String(item.value);
            } else if (item.key === "maintenance_mode" && item.value !== null) {
              newSettings.maintenanceMode = Boolean(item.value);
            }
          });
          setSettings(newSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upsert each setting
      const updates = [
        { key: "platform_name", value: settings.platformName },
        { key: "maintenance_mode", value: settings.maintenanceMode },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(
            {
              key: update.key,
              value: update.value,
              updated_by: user?.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({ 
        title: "Settings saved", 
        description: "Platform settings have been updated." 
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ 
        title: "Error saving settings", 
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout 
      title="Admin Settings" 
      description="Configure platform and admin settings" 
      isLoading={authLoading || isLoadingSettings} 
      onSignOut={signOut}
    >
      <div className="space-y-6 max-w-2xl">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Platform Configuration</h2>
              <p className="text-sm text-muted-foreground">Manage your platform settings and preferences</p>
            </div>
          </div>
        </div>

        {/* MFA Setup - Security First */}
        <MFASetup />

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Platform Settings
            </CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input 
                id="platform-name" 
                value={settings.platformName} 
                onChange={(e) => setSettings((prev) => ({ ...prev, platformName: e.target.value }))} 
                className="rounded-xl border-border/50"
              />
              <p className="text-xs text-muted-foreground">
                This name appears in emails and throughout the platform
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable public access temporarily</p>
                </div>
                <Switch 
                  checked={settings.maintenanceMode} 
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))} 
                />
              </div>
              
              {settings.maintenanceMode && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <strong>Warning:</strong> Maintenance mode is enabled. Public users will see a maintenance page instead of the main site. Admin access remains unaffected.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full rounded-xl h-12 shadow-lg shadow-primary/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}
