import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Clock, PlayCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface CheckResult {
  success: boolean;
  expired_count: number;
  active_grace_periods: number;
  checked_at: string;
  error?: string;
}

export const GracePeriodManager = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);

  const triggerGracePeriodCheck = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-grace-periods", {
        method: "POST",
      });

      if (error) {
        throw error;
      }

      setLastResult(data as CheckResult);

      if (data.expired_count > 0) {
        toast({
          title: "Grace periods processed",
          description: `${data.expired_count} expired grace period(s) have been processed.`,
        });
      } else {
        toast({
          title: "Check complete",
          description: "No expired grace periods found.",
        });
      }
    } catch (error) {
      console.error("Error triggering grace period check:", error);
      setLastResult({
        success: false,
        expired_count: 0,
        active_grace_periods: 0,
        checked_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast({
        title: "Error",
        description: "Failed to run grace period check. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          Grace Period Manager
        </CardTitle>
        <CardDescription>
          Manually trigger grace period expiration checks for testing or emergency use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            onClick={triggerGracePeriodCheck}
            disabled={isRunning}
            className="w-full sm:w-auto gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Check...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Run Grace Period Check
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center sm:text-left">
            This will process all expired grace periods and downgrade affected subscriptions.
          </p>
        </div>

        {lastResult && (
          <div className="rounded-xl border border-border/50 p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {lastResult.success ? "Check Completed" : "Check Failed"}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(lastResult.checked_at).toLocaleString()}
              </span>
            </div>

            {lastResult.success ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={lastResult.expired_count > 0 ? "destructive" : "secondary"}>
                    {lastResult.expired_count}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Expired & Processed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lastResult.active_grace_periods > 0 ? "outline" : "secondary"}>
                    {lastResult.active_grace_periods}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Active Grace Periods</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive">{lastResult.error}</p>
            )}
          </div>
        )}

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> This action is automatically run every hour via scheduled job.
              Use manual trigger only for testing or if you need immediate processing.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
