import type { Course } from "./course";

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: string | Course;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate: string;
  totalMarks: number;
  attachments: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  course: string;
  dueDate: string;
  totalMarks: number;
  attachments?: string[];
}

export interface Submission {
  _id: string;
  assignment: string | Assignment;
  student:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  textResponse: string;
  attachments: string[];
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
  feedback: string;
  gradedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmitAssignmentRequest {
  textResponse: string;
  attachments?: string[];
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
}
