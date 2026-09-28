import axios from "axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);

  return response.data;
};

export const registerUser = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/auth/register",
    data
  );

  return response.data;
};

export default api;