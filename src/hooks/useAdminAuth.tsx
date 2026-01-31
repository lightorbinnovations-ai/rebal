import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

export const useAdminAuth = (requireAuth: boolean = true) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    error: null,
  });

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      return data !== null;
    } catch (err) {
      console.error("Admin role check failed:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error("Session error:", sessionError);
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            error: sessionError.message,
          });
          return;
        }

        if (!session?.user) {
          // No session
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            error: null,
          });

          if (requireAuth && location.pathname !== "/admin/login") {
            navigate("/admin/login", { replace: true });
          }
          return;
        }

        // Check admin role
        const isAdmin = await checkAdminRole(session.user.id);

        if (!isMounted) return;

        setState({
          user: session.user,
          session,
          isLoading: false,
          isAdmin,
          error: null,
        });

        // Handle redirects
        if (isAdmin && location.pathname === "/admin/login") {
          navigate("/admin", { replace: true });
        } else if (!isAdmin && location.pathname !== "/admin/login" && requireAuth) {
          navigate("/admin/login", { replace: true });
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: "Authentication failed"
          }));
        }
      }
    };

    // Initialize
    initializeAuth();

    // Safety timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.warn("Auth check timed out, forcing redirect to login");

            // If we timed out, assume auth failed and redirect if needed
            if (requireAuth && location.pathname !== "/admin/login") {
              // Use a small delay to allow state update to process
              setTimeout(() => navigate("/admin/login", { replace: true }), 0);
            }

            return {
              ...prev,
              isLoading: false,
              user: null,
              session: null,
              error: prev.error || "Authentication check timed out"
            };
          }
          return prev;
        });
      }
    }, 10000); // 10 seconds max wait

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            error: null,
          });
          if (location.pathname !== "/admin/login") {
            navigate("/admin/login", { replace: true });
          }
          return;
        }

        // Handle sign in
        if (event === 'SIGNED_IN' && session?.user) {
          setState(prev => ({ ...prev, isLoading: true }));
          const isAdmin = await checkAdminRole(session.user.id);

          if (!isMounted) return;

          setState({
            user: session.user,
            session,
            isLoading: false,
            isAdmin,
            error: null,
          });

          if (isAdmin && location.pathname === "/admin/login") {
            navigate("/admin", { replace: true });
          } else if (!isAdmin && location.pathname !== "/admin/login" && requireAuth) {
            navigate("/admin/login", { replace: true });
          }
        }

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
        }
      }
    );

    authSubscription = subscription;

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [checkAdminRole, navigate, location.pathname, requireAuth]);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAdmin: false,
        error: null,
      });
      navigate("/admin/login", { replace: true });
    } catch (err) {
      console.error("Sign out error:", err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [navigate]);

  return { ...state, signOut };
};
