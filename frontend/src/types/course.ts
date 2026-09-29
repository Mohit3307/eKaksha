export interface CourseStudent {
  _id: string;
  name: string;
  email: string;
}

export interface CourseTeacher {
  _id: string;
  name: string;
  email: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category?: string;
  teacher: CourseTeacher;
  students?: CourseStudent[];
  joinCode?: string;
  status: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  category?: string;
}