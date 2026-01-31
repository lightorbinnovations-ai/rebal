import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export const useAuth = (requireAuth: boolean = true) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const isOAuthCallback = () => {
      // During OAuth redirects, the session may not be available on the *first* tick.
      // Supabase places tokens in the URL hash (implicit) or `code` in query params (PKCE).
      const hash = window.location.hash || "";
      const params = new URLSearchParams(window.location.search);
      return (
        hash.includes("access_token=") ||
        hash.includes("error=") ||
        params.has("code") ||
        params.has("error")
      );
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        });

        // If auth is required and we definitively know there's no session (e.g. SIGNED_OUT), redirect.
        // We still guard against redirecting during an OAuth callback.
        if (requireAuth && !session && !isOAuthCallback()) {
          navigate("/auth", { replace: true });
        }
      }
    );

    // Then check for existing session.
    // If we are in an OAuth callback, allow a short grace period for the session to be established.
    const resolveInitialSession = async () => {
      const inOAuth = isOAuthCallback();

      // First attempt
      const first = await supabase.auth.getSession();
      if (!isMounted) return;

      if (first.data.session) {
        setAuthState({
          user: first.data.session.user,
          session: first.data.session,
          isLoading: false,
        });
        return;
      }

      if (inOAuth) {
        // Give the client a moment to process the callback and emit an auth event.
        // If it doesn't happen, we fail open to redirect (when requireAuth) instead of infinite loading.
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        await new Promise((r) => setTimeout(r, 1200));

        const second = await supabase.auth.getSession();
        if (!isMounted) return;

        setAuthState({
          user: second.data.session?.user ?? null,
          session: second.data.session ?? null,
          isLoading: false,
        });

        if (requireAuth && !second.data.session) {
          navigate("/auth", { replace: true });
        }
        return;
      }

      // Normal unauthenticated state
      setAuthState({ user: null, session: null, isLoading: false });
      if (requireAuth) {
        navigate("/auth", { replace: true });
      }
    };

    resolveInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    window.location.href = '/auth';
  };

  return {
    ...authState,
    signOut,
  };
};