"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import { ApiError } from "../api/client";
import { loginRequest, logoutRequest, meRequest, refreshRequest } from "./api";
import { setAccessToken as setStoredAccessToken } from "./token-store";
import type { AuthUser, LoginValues } from "./types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (values: LoginValues) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_ADMIN_ERROR = new ApiError(403, {
  code: "NOT_ADMIN",
  message: "This account does not have admin access.",
  details: [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { accessToken: token } = await refreshRequest();
        const profile = await meRequest(token);
        if (cancelled) return;
        if (profile.type !== "admin") {
          await logoutRequest().catch(() => undefined);
          setStatus("unauthenticated");
          return;
        }
        setAccessToken(token);
        setStoredAccessToken(token);
        setUser(profile);
        setStatus("authenticated");
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (values: LoginValues) => {
    const result = await loginRequest(values);
    if (result.user.type !== "admin") {
      await logoutRequest().catch(() => undefined);
      throw NOT_ADMIN_ERROR;
    }
    setAccessToken(result.accessToken);
    setStoredAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => undefined);
    setAccessToken(null);
    setStoredAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
