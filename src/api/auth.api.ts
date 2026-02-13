/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { setAuthToken } from "../api/api";
import axios from "axios";
import type { User } from "./user.api";

export interface LoginPayload {
  login: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  user: any; // raw backend user
}

const TOKEN_KEY = "epaper_auth_token";

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  setToken(null);
}

/* ----------------------------- Transform ------------------------------- */
function transformLoginUser(backendUser: any): User {
  return {
    ...backendUser,
    _id: String(backendUser.id), // convert number to string
    id: undefined, // remove if you don't need it
  };
}

/* ----------------------------- API Calls ------------------------------- */
export async function login(payload: LoginPayload): Promise<User> {
  try {
    const res = await api.post<AuthResponse>("/auth/login", payload);
    const { token, user } = res.data;
    if (token) setToken(token);
    return transformLoginUser(user);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
    throw err;
  }
}

export async function logout(): Promise<void> {
  clearToken();
}

export default {
  login,
  logout,
  setToken,
  getToken,
  clearToken,
};
