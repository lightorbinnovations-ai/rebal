import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const AuthCard = ({ title, description, children, className }: AuthCardProps) => {
  return (
    <Card className={cn("border-border/50 shadow-2xl backdrop-blur-sm bg-card/80", className)}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl font-heading">
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {children}
      </CardContent>
    </Card>
  );
};
