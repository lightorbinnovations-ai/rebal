import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = 'admin_lock_state';

interface LockState {
    isLocked: boolean;
    lockTime: number | null;
}

export const useAdminSession = () => {
    const location = useLocation();
    const [isLocked, setIsLocked] = useState<boolean>(() => {
        // Restore lock state from local storage on mount
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed: LockState = JSON.parse(saved);
            return parsed.isLocked;
        }
        return false;
    });

    const lockSession = useCallback(() => {
        setIsLocked(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            isLocked: true,
            lockTime: Date.now()
        } as LockState));
    }, []);

    const unlockSession = useCallback(() => {
        setIsLocked(false);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const resetTimer = () => {
            if (isLocked) return;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Only lock if we are actually on an admin page
                if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
                    lockSession();
                }
            }, INACTIVITY_LIMIT_MS);
        };

        // Initialize timer
        resetTimer();

        // Listen for activity
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [isLocked, location.pathname, lockSession]);

    return {
        isLocked,
        lockSession,
        unlockSession
    };
};
