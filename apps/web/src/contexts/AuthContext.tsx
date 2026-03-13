import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserCredits } from "@/services/stripe";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  credits: number;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  credits: 0,
  loading: true,
  signOut: async () => {},
  refreshCredits: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshCredits = useCallback(async () => {
    const c = await getUserCredits();
    setCredits(c);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // If hash contains OAuth tokens, manually set the session.
        // Check token freshness first — discard if issued > 120s ago.
        if (window.location.hash.length > 1) {
          try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            const expiresAt = params.get("expires_at");

            if (accessToken && refreshToken) {
              // Check if the token is stale (issued more than 120s ago)
              const isStale = expiresAt
                ? parseInt(expiresAt, 10) < Math.round(Date.now() / 1000)
                : false;

              if (isStale) {
                console.log("[Auth] stale hash tokens, clearing");
                window.location.hash = "";
              } else {
                const { data, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                // Always clear hash after attempting setSession
                window.location.hash = "";
                if (!sessionError && data.user) {
                  setUser(data.user);
                  await refreshCredits();
                  return;
                }
              }
            } else {
              // Hash present but no tokens — just clear it
              window.location.hash = "";
            }
          } catch (err) {
            console.error("[Auth] OAuth callback error:", err);
            window.location.hash = "";
          }
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) {
          await refreshCredits();
        }
      } catch (err) {
        console.error("[Auth] init error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await refreshCredits();
      } else {
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshCredits]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCredits(0);
  }, []);

  return (
    <AuthContext.Provider value={{ user, credits, loading, signOut, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
