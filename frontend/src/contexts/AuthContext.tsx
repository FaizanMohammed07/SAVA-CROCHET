import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ requires2FA?: boolean; tempToken?: string }>;
  verify2FALogin: (
    tempToken: string,
    token?: string,
    backupCode?: string,
  ) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = Cookies.get("accessToken");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const { data } = await api.get("/auth/me");
      setUser(data.data?.user || data.data || data.user || data);
    } catch {
      setUser(null);
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ requires2FA?: boolean; tempToken?: string }> => {
    const { data } = await api.post("/auth/login", { email, password });
    const res = data.data || data;

    // If 2FA is required, return the challenge info without setting tokens
    if (res.requires2FA) {
      return { requires2FA: true, tempToken: res.tempToken };
    }

    // Normal login — set tokens
    // Access token expires in 0.5 days (12 hours), refresh token in 7 days
    Cookies.set("accessToken", res.accessToken, { expires: 0.5 });
    if (res.refreshToken)
      Cookies.set("refreshToken", res.refreshToken, { expires: 7 });
    setUser(res.user);
    return {};
  };

  const verify2FALogin = async (
    tempToken: string,
    token?: string,
    backupCode?: string,
  ) => {
    const { data } = await api.post("/auth/2fa/verify-login", {
      tempToken,
      token,
      backupCode,
    });
    const res = data.data || data;
    Cookies.set("accessToken", res.accessToken, { expires: 0.5 });
    if (res.refreshToken)
      Cookies.set("refreshToken", res.refreshToken, { expires: 7 });
    setUser(res.user);
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string,
  ) => {
    const { data } = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
      phone,
    });
    const res = data.data || data;
    Cookies.set("accessToken", res.accessToken, { expires: 0.5 });
    if (res.refreshToken)
      Cookies.set("refreshToken", res.refreshToken, { expires: 7 });
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      setUser(null);
    }
  };

  const updateUser = (u: User) => setUser(u);
  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin" || user?.role === "superadmin",
        login,
        verify2FALogin,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
