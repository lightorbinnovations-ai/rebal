import { useEffect, useState } from "react";

export const AppLoader = () => {
    const [show, setShow] = useState(false);

    // Small delay to prevent flash for very fast loads
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative flex flex-col items-center">
                <img
                    src="/favicon.png"
                    alt="Loading..."
                    className="h-16 w-16 animate-pulse object-contain"
                />
                {/* Optional: Add a subtle text or spinner below if needed, but user asked for logo */}
            </div>
        </div>
    );
};
