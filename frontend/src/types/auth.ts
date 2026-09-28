export type UserRole = "teacher" | "student";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}