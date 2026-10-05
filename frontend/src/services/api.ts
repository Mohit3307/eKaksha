import axios from "axios";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

import type { Course, CreateCourseRequest } from "../types/course";

import type {
  Assignment,
  CreateAssignmentRequest,
  Submission,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
} from "../types/assignment";

import type { Announcement } from "../types/announcement";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  },
);

/* =========================
   AUTH
========================= */

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);

  return response.data;
};

export const registerUser = async (
  data: RegisterRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", data);

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
  const response = await api.put("/auth/profile", data);

  return response.data;
};

/* =========================
   COURSES
========================= */

export const getMyCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>("/courses");

  return response.data;
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await api.get<Course>(`/courses/${courseId}`);

  return response.data;
};

export const createCourse = async (
  data: CreateCourseRequest,
): Promise<Course> => {
  const response = await api.post<Course>("/courses", data);

  return response.data;
};

export const joinCourse = async (joinCode: string): Promise<Course> => {
  const response = await api.post<Course>("/courses/join", {
    joinCode,
  });

  return response.data;
};

export const archiveCourse = async (courseId: string) => {
  const response = await api.put(`/courses/${courseId}/archive`);

  return response.data;
};

export const manageRoster = async (
  courseId: string,
  studentId: string,
  action: "add" | "remove",
): Promise<Course> => {
  const response = await api.put<Course>(`/courses/${courseId}/roster`, {
    studentId,
    action,
  });

  return response.data;
};

export const getCourseProgress = async (courseId: string) => {
  const response = await api.get(`/courses/${courseId}/progress`);

  return response.data;
};

/* =========================
   ASSIGNMENTS
========================= */

export const createAssignment = async (
  data: CreateAssignmentRequest,
): Promise<Assignment> => {
  const response = await api.post<Assignment>("/assignments", data);

  return response.data;
};

export const getAssignmentsByCourse = async (
  courseId: string,
): Promise<Assignment[]> => {
  const response = await api.get<Assignment[]>(
    `/assignments/course/${courseId}`,
  );

  return response.data;
};

export const getAssignment = async (
  assignmentId: string,
): Promise<Assignment> => {
  const response = await api.get<Assignment>(`/assignments/${assignmentId}`);

  return response.data;
};

export const deleteAssignment = async (assignmentId: string) => {
  const response = await api.delete(`/assignments/${assignmentId}`);

  return response.data;
};

/* =========================
   SUBMISSIONS
========================= */

export const submitAssignment = async (
  assignmentId: string,
  data: SubmitAssignmentRequest,
): Promise<Submission> => {
  const response = await api.post<Submission>(
    `/submissions/assignment/${assignmentId}`,
    data,
  );

  return response.data;
};

export const getMySubmissions = async (): Promise<Submission[]> => {
  const response = await api.get<Submission[]>("/submissions/mine");

  return response.data;
};

export const getAssignmentSubmissions = async (
  assignmentId: string,
): Promise<Submission[]> => {
  const response = await api.get<Submission[]>(
    `/submissions/assignment/${assignmentId}`,
  );

  return response.data;
};

export const gradeSubmission = async (
  submissionId: string,
  data: GradeSubmissionRequest,
): Promise<Submission> => {
  const response = await api.put<Submission>(
    `/submissions/${submissionId}/grade`,
    data,
  );

  return response.data;
};

/* =========================
   ANNOUNCEMENTS
========================= */

export const getAnnouncementsByCourse = async (
  courseId: string,
): Promise<Announcement[]> => {
  const response = await api.get<Announcement[]>(
    `/announcements/course/${courseId}`,
  );

  return response.data;
};

export const createAnnouncement = async (
  courseId: string,
  content: string,
  attachments: string[] = [],
): Promise<Announcement> => {
  const response = await api.post<Announcement>(
    `/announcements/course/${courseId}`,
    {
      content,
      attachments,
    },
  );

  return response.data;
};

export const deleteAnnouncement = async (
  announcementId: string,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/announcements/${announcementId}`,
  );

  return response.data;
};

export default api;