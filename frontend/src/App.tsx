import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import Login from "./pages/login";
import Register from "./pages/register";

import Dashboard from "./pages/Dashboard";
import Courses from "./pages/courses/Courses";
import CreateCourse from "./pages/courses/CreateCourse";
import JoinCourse from "./pages/courses/JoinCourse";
import CourseDetails from "./pages/courses/CourseDetails";
import Assignments from "./pages/assignments/Assignments";
import CreateAssignment from "./pages/assignments/CreateAssignment";
import AssignmentDetails from "./pages/assignments/AssignmentDetails";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherSubmissionDetails from "./pages/assignments/TeacherSubmissionDetails";
import Announcements from "./pages/announcements/Announcements";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/create" element={<CreateCourse />} />
          <Route path="/courses/join" element={<JoinCourse />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/courses/:id/assignments" element={<Assignments />} />
          <Route
            path="/courses/:id/assignments/create"
            element={<CreateAssignment />}
          />
          <Route
            path="/courses/:id/announcements"
            element={<Announcements />}
          />
          <Route path="/assignments/:id" element={<AssignmentDetails />} />
          <Route
            path="/assignments/:assignmentId/submissions/:submissionId"
            element={<TeacherSubmissionDetails />}
          />
        </Route>
      </Route>

      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Unknown route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
