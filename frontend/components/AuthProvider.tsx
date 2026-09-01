"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/api";
import type { PublicUser } from "@/lib/types";

type AuthState = {
  user: PublicUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ token: string; user: PublicUser }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }

    api<{ user: PublicUser }>("/api/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    const isAuthPage = pathname === "/";
    if (!user && !isAuthPage) {
      router.replace("/");
      return;
    }
    if (user && isAuthPage) {
      router.replace(user.role === "CREW_LEAD" ? "/bridge" : "/cabin");
      return;
    }
    if (user?.role === "PASSENGER" && pathname.startsWith("/bridge")) {
      router.replace("/cabin");
    }
    if (user?.role === "CREW_LEAD" && pathname.startsWith("/cabin")) {
      router.replace("/bridge");
    }
  }, [pathname, ready, router, user]);

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
