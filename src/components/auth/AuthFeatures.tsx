import { Sparkles } from "lucide-react";

export const AuthFeatures = () => {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="space-y-2">
        <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground">Free to Start</p>
      </div>
      <div className="space-y-2">
        <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">Secure Login</p>
      </div>
      <div className="space-y-2">
        <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">Instant Setup</p>
      </div>
    </div>
  );
};
