/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "../api/api";
import axios from "axios";

/**
 * Frontend-friendly User type (kept exactly as before)
 */
export interface UserBase {
  _id: string; // we will create this from backend's `id`
  userId?: string; // optional – your frontend uses it, backend doesn't send it
  fullName: string;
  email: string;
  role: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type User = UserBase & Record<string, unknown>;

/* ------------------------- Error helper ------------------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (isRecord(data)) {
      const maybeMessage = data["message"];
      const maybeError = data["error"];
      if (typeof maybeMessage === "string" && maybeMessage.length)
        return maybeMessage;
      if (typeof maybeError === "string" && maybeError.length)
        return maybeError;
    }
    return err.message ?? "Unknown Axios error";
  }
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/* ------------------------- Transform helpers -------------------------- */

/**
 * Convert backend user object (with numeric `id`) to frontend User (with string `_id`)
 */
function transformUser(backendUser: any): User {
  return {
    ...backendUser,
    _id: String(backendUser.id), // create _id from id
    id: undefined, // remove numeric id (optional)
    // Ensure dates are strings (backend sends ISO strings)
    createdAt: backendUser.createdAt || new Date().toISOString(),
    updatedAt: backendUser.updatedAt || new Date().toISOString(),
  };
}

/* ----------------------------- API Calls ------------------------------- */

/** GET /api/users – backend returns paginated object, we extract the array */
export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await api.get("/users");
    // The backend sends: { total, page, totalPages, data: [...] }
    const backendData = res.data.data;
    if (!Array.isArray(backendData)) {
      console.warn("Unexpected getAllUsers response", res.data);
      return [];
    }
    return backendData.map(transformUser);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** GET /api/users/:id */
export async function getUserById(id: string): Promise<User> {
  try {
    const res = await api.get(`/users/${id}`);
    return transformUser(res.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** POST /api/users */
export async function createUser(payload: Partial<User>): Promise<User> {
  try {
    const res = await api.post("/users", payload);
    return transformUser(res.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/** PUT /api/users/:id */
export async function updateUser(
  id: string,
  payload: Partial<User>,
): Promise<User> {
  try {
    const res = await api.put(`/users/${id}`, payload);
    return transformUser(res.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

/* ----------------------------- Default export -------------------------- */
export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
};
