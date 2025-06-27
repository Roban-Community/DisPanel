import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  botId: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    botId: null,
  });

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Session check successful:", data);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          botId: data.botId,
        });
        return true;
      } else {
        console.log("Session check failed:", res.status);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          botId: null,
        });
        return false;
      }
    } catch (error) {
      console.log("Session check error:", error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        botId: null,
      });
      return false;
    }
  }, []);

  useEffect(() => {
    // Check session once on mount
    checkSession();
  }, [checkSession]);

  const login = async (token: string) => {
    try {
      const res = await fetch('/api/auth/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success && res.ok) {
        console.log("Login successful, updating auth state for bot:", data.bot.id);
        
        // Force immediate state update
        setAuthState(prevState => {
          console.log("Auth state update - prev:", prevState, "new:", {
            isAuthenticated: true,
            isLoading: false,
            botId: data.bot.id,
          });
          return {
            isAuthenticated: true,
            isLoading: false,
            botId: data.bot.id,
          };
        });
        
        return { success: true, bot: data.bot };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      botId: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
    checkSession,
  };
}