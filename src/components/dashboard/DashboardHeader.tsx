import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, User, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationsDropdown } from "./NotificationsDropdown";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface DashboardHeaderProps {
  user: SupabaseUser | null;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
}

export const DashboardHeader = ({
  user,
  isDark,
  toggleTheme,
  onSignOut,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border/50 bg-background/95 backdrop-blur-xl px-3 sm:px-4 md:px-6">
      <SidebarTrigger className="md:hidden hover:bg-muted rounded-lg transition-colors flex-shrink-0" />
      <Separator orientation="vertical" className="h-6 md:hidden flex-shrink-0" />

      {/* Left side - can add breadcrumbs here later */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Dashboard
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="rounded-xl hover:bg-muted/80 transition-colors h-9 w-9 sm:h-10 sm:w-10"
        >
          {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 hover:bg-muted/80">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={userName}
                  className="rounded-xl"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs sm:text-sm font-medium rounded-xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl border-border/50 shadow-xl bg-background" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} className="rounded-xl" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none truncate">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate("/dashboard/settings")}
              className="rounded-lg mx-2 cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/dashboard/settings")}
              className="rounded-lg mx-2 cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg mx-2 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
