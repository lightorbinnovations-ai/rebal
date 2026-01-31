import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Navigation, Zap, Settings } from "lucide-react";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
  formatShortcut: (shortcut: KeyboardShortcut) => string;
}

const categoryIcons = {
  navigation: Navigation,
  actions: Zap,
  general: Settings,
};

const categoryLabels = {
  navigation: "Navigation",
  actions: "Quick Actions",
  general: "General",
};

export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
  shortcuts,
  formatShortcut,
}: KeyboardShortcutsDialogProps) => {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryOrder: (keyof typeof categoryLabels)[] = ["actions", "navigation", "general"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster. Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Ctrl + /</kbd> anytime to see this list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categoryOrder.map((category) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

            const Icon = categoryIcons[category];

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {categoryLabels[category]}
                  </h3>
                </div>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">{shortcut.description}</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Shortcuts don't work when typing in text fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
