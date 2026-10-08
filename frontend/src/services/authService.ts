import axios from "axios";
import apiClient from "./apiClient";
import type { TokenResponse, User } from "../types/auth";

/* =====================================================================
   Customer auth (Madeeha): used by Login, Register, Profile pages
   and AuthContext. Uses the shared apiClient, which attaches the token.
   ===================================================================== */
export const authService = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<User>("/api/auth/register", { name, email, password }).then((r) => r.data),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/api/auth/login", { email, password }).then((r) => r.data),

  adminLogin: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/api/auth/admin/login", { email, password }).then((r) => r.data),

  logout: () => apiClient.post("/api/auth/logout").then(() => undefined),

  me: () => apiClient.get<User>("/api/auth/me").then((r) => r.data),
};

/* =====================================================================
   Admin session (Rishi): used by the admin dashboard.
   Admin login through Madeeha's authentication module (POST /api/auth/admin/login).
   The backend returns a JWT; we keep it and send it with every admin API request.
   ===================================================================== */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// Shape of the response from /api/auth/login and /api/auth/admin/login
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string; // "admin" or "customer"
    status: string;
  };
}

export interface Session {
  token: string;
  name: string;
  email: string;
  role: string;
}

const STORAGE_KEY = "viora_admin_session";

async function requestAdminLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/api/auth/admin/login`, {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  } catch (err) {
    if (!axios.isAxiosError(err) || !err.response) {
      throw new Error("Cannot reach the server. Check that the backend is running.");
    }
    const { status, data } = err.response;
    const detail = typeof data?.detail === "string" ? data.detail : "";
    // 401 is the same for a wrong email, a wrong password and a non-admin account
    if (status === 401) throw new Error(detail || "Invalid email or password");
    if (status === 403) throw new Error(detail || "Account is deactivated");
    if (status === 429) throw new Error(detail || "Too many failed attempts. Try again in 15 minutes.");
    if (status === 404) throw new Error("Admin login is not available on the server yet.");
    throw new Error("Something went wrong. Try again.");
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const data = await requestAdminLogin(email, password);

  if (data.user.role !== "admin") {
    throw new Error("This account does not have admin access.");
  }

  const session: Session = {
    token: data.access_token,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked (private mode): session lasts only until refresh
  }
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}