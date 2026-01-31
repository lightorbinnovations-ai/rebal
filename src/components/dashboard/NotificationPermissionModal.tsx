import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NotificationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAllow: () => void;
}

export const NotificationPermissionModal = ({
    isOpen,
    onClose,
    onAllow,
}: NotificationPermissionModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        Enable Notifications?
                    </DialogTitle>
                </DialogHeader>

                <div className="text-center space-y-4 py-2">
                    <p className="text-muted-foreground">
                        Get real-time updates for new inquiries, payments, and important account activity.
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 justify-center mt-4">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                            Not Now
                        </Button>
                        <Button onClick={onAllow} className="w-full sm:w-auto shine-effect">
                            Allow Notifications
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        You can manage this anytime in browser settings.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
