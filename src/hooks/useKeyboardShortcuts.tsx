import { useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: "navigation" | "actions" | "general";
}

const SHORTCUT_REMINDER_KEY = "keyboard_shortcut_last_reminder";
const SHORTCUT_REMINDER_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const SHORTCUT_VIEW_COUNT_KEY = "keyboard_shortcut_view_count";
const SHORTCUT_VIEWS_BEFORE_REMINDER = 10; // Show reminder after 10 page views
const FIRST_VISIT_KEY = "dashboard_first_visit_complete";

export const useKeyboardShortcuts = (
  enabled: boolean = true,
  onOpenCommandPalette?: () => void
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Define all shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      ctrl: true,
      description: "Add new property",
      action: () => navigate("/dashboard/properties/new"),
      category: "actions",
    },
    {
      key: "a",
      ctrl: true,
      shift: true,
      description: "View analytics",
      action: () => navigate("/dashboard/analytics"),
      category: "navigation",
    },
    {
      key: "p",
      ctrl: true,
      shift: true,
      description: "Go to properties",
      action: () => navigate("/dashboard/properties"),
      category: "navigation",
    },
    {
      key: "i",
      ctrl: true,
      shift: true,
      description: "View inquiries",
      action: () => navigate("/dashboard/inquiries"),
      category: "navigation",
    },
    {
      key: "b",
      ctrl: true,
      shift: true,
      description: "Go to branding",
      action: () => navigate("/dashboard/branding"),
      category: "navigation",
    },
    {
      key: ",",
      ctrl: true,
      description: "Open settings",
      action: () => navigate("/dashboard/settings"),
      category: "navigation",
    },
    {
      key: "h",
      ctrl: true,
      shift: true,
      description: "View documentation",
      action: () => navigate("/dashboard/help"),
      category: "navigation",
    },
    {
      key: "d",
      ctrl: true,
      shift: true,
      description: "Go to dashboard overview",
      action: () => navigate("/dashboard"),
      category: "navigation",
    },
    {
      key: "l",
      ctrl: true,
      shift: true,
      description: "Manage short links",
      action: () => navigate("/dashboard/links"),
      category: "navigation",
    },
    {
      key: "k",
      ctrl: true,
      description: "Open command palette",
      action: () => onOpenCommandPalette?.(),
      category: "general",
    },
    {
      key: "/",
      ctrl: true,
      description: "Show keyboard shortcuts",
      action: () => setShowShortcutsDialog(true),
      category: "general",
    },
  ];

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  // Show first-time welcome toast
  const showFirstTimeWelcome = useCallback(() => {
    if (!enabled) return;

    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    if (hasVisited) return;

    // Mark as visited
    localStorage.setItem(FIRST_VISIT_KEY, "true");

    // Show welcome toast after a short delay
    setTimeout(() => {
      toast("🎉 Welcome to your dashboard!", {
        description: "Pro tip: Press Ctrl + / to discover keyboard shortcuts that help you work faster.",
        duration: 8000,
        action: {
          label: "Show Shortcuts",
          onClick: () => setShowShortcutsDialog(true),
        },
      });
    }, 1500);
  }, [enabled]);

  // Check if should show reminder (for returning users)
  const checkAndShowReminder = useCallback(() => {
    if (!enabled) return;

    // Don't show reminder on first visit
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!hasVisited) return;

    const lastReminder = localStorage.getItem(SHORTCUT_REMINDER_KEY);
    const viewCount = parseInt(localStorage.getItem(SHORTCUT_VIEW_COUNT_KEY) || "0", 10);
    const now = Date.now();

    // Increment view count
    localStorage.setItem(SHORTCUT_VIEW_COUNT_KEY, String(viewCount + 1));

    // Check if enough time has passed and enough views
    const shouldShowByTime = !lastReminder || now - parseInt(lastReminder, 10) > SHORTCUT_REMINDER_INTERVAL;
    const shouldShowByViews = (viewCount + 1) % SHORTCUT_VIEWS_BEFORE_REMINDER === 0;

    if (shouldShowByTime && shouldShowByViews) {
      // Show reminder toast after a short delay
      setTimeout(() => {
        toast("⌨️ Pro tip: Use keyboard shortcuts!", {
          description: "Press Ctrl + / to see all available shortcuts",
          duration: 5000,
          action: {
            label: "Show All",
            onClick: () => setShowShortcutsDialog(true),
          },
        });
        localStorage.setItem(SHORTCUT_REMINDER_KEY, String(now));
      }, 2000);
    }
  }, [enabled]);

  // Set up event listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Check for first visit and reminders on dashboard route
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard")) {
      showFirstTimeWelcome();
      checkAndShowReminder();
    }
  }, [location.pathname, showFirstTimeWelcome, checkAndShowReminder]);

  // Format shortcut for display
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push(isMac ? "⌘" : "Ctrl");
    if (shortcut.shift) parts.push(isMac ? "⇧" : "Shift");
    if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt");
    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  };

  return {
    shortcuts,
    showShortcutsDialog,
    setShowShortcutsDialog,
    formatShortcut,
  };
};
