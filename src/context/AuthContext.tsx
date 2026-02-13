// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import authApi from "../api/auth.api";
import { setAuthToken } from "../api/api";

// Use export type instead of just export
export type User = {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  userName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (login: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "epaper_auth_token";
const USER_KEY = "epaper_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    const raw =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Apply token to axios on load / change
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = async (
    loginValue: string,
    password: string,
    remember = false
  ) => {
    setLoading(true);
    try {
      const apiUser = await authApi.login({
        login: loginValue,
        password,
      });

      const token = authApi.getToken();

      if (!token) {
        throw new Error("Token missing from response");
      }

      // Normalize the user object
      const normalizedUser: User = {
        _id: apiUser._id || "",
        id: apiUser._id || "",
        fullName: apiUser.fullName || "",
        email: apiUser.email || "",
        userName: apiUser.userName || "",
        role: apiUser.role || "Staff",
        createdAt: apiUser.createdAt,
        updatedAt: apiUser.updatedAt,
      };

      setUser(normalizedUser);
      setTokenState(token);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(normalizedUser));

      setAuthToken(token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    authApi.clearToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
