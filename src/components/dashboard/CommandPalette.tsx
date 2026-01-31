import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  BarChart3,
  MessageSquare,
  Palette,
  Link2,
  Settings,
  HelpCircle,
  Plus,
  Search,
  ExternalLink,
  Users,
  Bell,
  Bookmark,
  FileText,
  Keyboard,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/types/company";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
  onShowShortcuts?: () => void;
}

interface CommandAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
  badge?: string;
  realtorOnly?: boolean; // If true, hidden for affiliate accounts
}

export const CommandPalette = ({
  open,
  onOpenChange,
  company,
  isDark,
  toggleTheme,
  onSignOut,
  onShowShortcuts,
}: CommandPaletteProps) => {
  const navigate = useNavigate();
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const runAction = useCallback((action: () => void) => {
    onOpenChange(false);
    // Small delay to allow dialog to close smoothly
    setTimeout(action, 150);
  }, [onOpenChange]);

  const isAffiliate = company?.account_type === "affiliate";

  // Navigation commands
  const navigationCommands: CommandAction[] = [
    {
      id: "nav-dashboard",
      label: "Dashboard Overview",
      icon: Home,
      shortcut: `${modKey}+Shift+D`,
      action: () => runAction(() => navigate("/dashboard")),
      keywords: ["home", "overview", "main"],
    },
    {
      id: "nav-properties",
      label: "Properties",
      icon: Building2,
      shortcut: `${modKey}+Shift+P`,
      action: () => runAction(() => navigate("/dashboard/properties")),
      keywords: ["listings", "houses", "real estate"],
      realtorOnly: true,
    },
    {
      id: "nav-analytics",
      label: "Analytics",
      icon: BarChart3,
      shortcut: `${modKey}+Shift+A`,
      action: () => runAction(() => navigate("/dashboard/analytics")),
      keywords: ["stats", "metrics", "data", "views"],
      realtorOnly: true,
    },
    {
      id: "nav-inquiries",
      label: "Inquiries",
      icon: MessageSquare,
      shortcut: `${modKey}+Shift+I`,
      action: () => runAction(() => navigate("/dashboard/inquiries")),
      keywords: ["messages", "leads", "contacts"],
      realtorOnly: true,
    },
    {
      id: "nav-branding",
      label: "Branding",
      icon: Palette,
      shortcut: `${modKey}+Shift+B`,
      action: () => runAction(() => navigate("/dashboard/branding")),
      keywords: ["colors", "theme", "style", "customize"],
      realtorOnly: true,
    },
    {
      id: "nav-links",
      label: "Short Links",
      icon: Link2,
      shortcut: `${modKey}+Shift+L`,
      action: () => runAction(() => navigate("/dashboard/links")),
      keywords: ["urls", "share", "qr"],
      realtorOnly: true,
    },
    {
      id: "nav-settings",
      label: "Settings",
      icon: Settings,
      shortcut: `${modKey}+,`,
      action: () => runAction(() => navigate("/dashboard/settings")),
      keywords: ["account", "subscription", "billing"],
    },
    {
      id: "nav-referrals",
      label: "Referrals",
      icon: Users,
      action: () => runAction(() => navigate("/dashboard/referrals")),
      keywords: ["affiliate", "invite", "earn"],
    },
    {
      id: "nav-saved-searches",
      label: "Saved Searches",
      icon: Bookmark,
      action: () => runAction(() => navigate("/dashboard/saved-searches")),
      keywords: ["alerts", "notifications"],
      realtorOnly: true,
    },
    {
      id: "nav-help",
      label: "Help Center",
      icon: HelpCircle,
      shortcut: `${modKey}+Shift+H`,
      action: () => runAction(() => navigate("/dashboard/help")),
      keywords: ["support", "docs", "faq"],
    },
  ];

  // Filter based on account type
  const filteredNavigationCommands = isAffiliate
    ? navigationCommands.filter(cmd => !cmd.realtorOnly)
    : navigationCommands;

  // Quick actions
  const quickActions: CommandAction[] = [
    {
      id: "action-new-property",
      label: "Add New Property",
      icon: Plus,
      shortcut: `${modKey}+N`,
      action: () => runAction(() => navigate("/dashboard/properties/new")),
      keywords: ["create", "listing", "add"],
      badge: "Quick",
      realtorOnly: true,
    },
    {
      id: "action-view-page",
      label: "View Public Page",
      icon: ExternalLink,
      action: () => runAction(() => {
        if (company?.slug) {
          window.open(`/${company.slug}`, "_blank");
        }
      }),
      keywords: ["preview", "live", "public"],
      realtorOnly: true,
    },
    {
      id: "action-marketplace",
      label: "Browse Marketplace",
      icon: Search,
      action: () => runAction(() => navigate("/properties")),
      keywords: ["search", "find", "explore"],
    },
  ];

  // Filter quick actions based on account type
  const filteredQuickActions = isAffiliate
    ? quickActions.filter(cmd => !cmd.realtorOnly)
    : quickActions;

  // System commands
  const systemCommands: CommandAction[] = [
    {
      id: "system-shortcuts",
      label: "Keyboard Shortcuts",
      icon: Keyboard,
      shortcut: `${modKey}+/`,
      action: () => runAction(() => onShowShortcuts?.()),
      keywords: ["hotkeys", "keys"],
    },
    {
      id: "system-theme",
      label: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: isDark ? Sun : Moon,
      action: () => runAction(toggleTheme),
      keywords: ["dark", "light", "theme", "mode"],
    },
    {
      id: "system-signout",
      label: "Sign Out",
      icon: LogOut,
      action: () => runAction(onSignOut),
      keywords: ["logout", "exit"],
    },
  ];

  // Settings tabs quick access
  const settingsTabs: CommandAction[] = [
    {
      id: "settings-account",
      label: "Account Settings",
      icon: Settings,
      action: () => runAction(() => navigate("/dashboard/settings?tab=account")),
      keywords: ["profile", "password"],
    },
    {
      id: "settings-subscription",
      label: "Subscription & Plans",
      icon: Sparkles,
      action: () => runAction(() => navigate("/dashboard/settings?tab=subscription")),
      keywords: ["upgrade", "pricing", "billing"],
    },
    {
      id: "settings-features",
      label: "Premium Features",
      icon: Zap,
      action: () => runAction(() => navigate("/dashboard/settings?tab=features")),
      keywords: ["domain", "verification", "badge"],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {filteredQuickActions.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {cmd.badge}
                </Badge>
              )}
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {filteredNavigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settingsTabs.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          {systemCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
