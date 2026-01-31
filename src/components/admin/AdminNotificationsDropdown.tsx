import { Bell, CreditCard, MessageSquare, BadgeCheck, Banknote, AlertCircle, Globe, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "payment":
      return <CreditCard className="h-4 w-4 text-green-500" />;
    case "support":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "verification":
      return <BadgeCheck className="h-4 w-4 text-purple-500" />;
    case "withdrawal":
      return <Banknote className="h-4 w-4 text-amber-500" />;
    case "domain":
      return <Globe className="h-4 w-4 text-cyan-500" />;
    case "boost":
      return <Rocket className="h-4 w-4 text-orange-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getNotificationLink = (type: string, metadata?: Record<string, unknown>): string => {
  switch (type) {
    case "payment":
      return "/admin/payments";
    case "support":
      return "/admin/support";
    case "verification":
      return "/admin/verifications";
    case "withdrawal":
      return "/admin/withdrawals";
    case "domain":
      return "/admin/domains";
    case "boost":
      return "/admin/properties";
    default:
      return "/admin";
  }
};

export function AdminNotificationsDropdown() {
  const { notifications, unreadCount, isLoading, markAsRead } = useAdminNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl hover:bg-muted/80 transition-colors h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 rounded-xl border-border/50 shadow-xl bg-background mx-2 sm:mx-0"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between py-3 px-4">
          <span className="font-semibold">Admin Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} pending
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">All caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer focus:bg-muted/50",
                  notification.status === "pending" && "bg-primary/5"
                )}
                asChild
              >
                <Link
                  to={getNotificationLink(notification.type)}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm line-clamp-2",
                      notification.status === "pending" && "font-medium"
                    )}>
                      {notification.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {notification.status === "pending" && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center text-sm" asChild>
            <Link to="/admin/notifications">View All Notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
