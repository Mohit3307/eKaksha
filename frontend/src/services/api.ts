import axios from "axios";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

import type {
  Course,
  CreateCourseRequest,
} from "../types/course";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Automatically attach JWT token
 * to protected API requests.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */

export const loginUser = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/auth/login",
    data
  );

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

export const getProfile = async () => {
  const response = await api.get("/auth/profile");

  return response.data;
};

export const updateProfile = async (data: {
  name?: string;
  profilePicture?: string;
  password?: string;
}) => {
  const response = await api.put(
    "/auth/profile",
    data
  );

  return response.data;
};

/* =========================
   COURSES
========================= */

export const getMyCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>("/courses");

  return response.data;
};

export const getCourseById = async (
  courseId: string
): Promise<Course> => {
  const response = await api.get<Course>(
    `/courses/${courseId}`
  );

  return response.data;
};

export const createCourse = async (
  data: CreateCourseRequest
): Promise<Course> => {
  const response = await api.post<Course>(
    "/courses",
    data
  );

  return response.data;
};

export const joinCourse = async (
  joinCode: string
): Promise<Course> => {
  const response = await api.post<Course>(
    "/courses/join",
    {
      joinCode,
    }
  );

  return response.data;
};
export const archiveCourse = async (courseId: string) => {
  const response = await api.put(`/courses/${courseId}/archive`);

  return response.data;
};

export const manageRoster = async (
  courseId: string,
  studentId: string,
  action: "add" | "remove"
): Promise<Course> => {
  const response = await api.put<Course>(
    `/courses/${courseId}/roster`,
    {
      studentId,
      action,
    }
  );

  return response.data;
};

export const getCourseProgress = async (
  courseId: string
) => {
  const response = await api.get(
    `/courses/${courseId}/progress`
  );

  return response.data;
};

export default api;