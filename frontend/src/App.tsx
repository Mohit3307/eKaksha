import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/login";
import Register from "./pages/register";

import Dashboard from "./pages/Dashboard";
import Courses from "./pages/courses/Courses";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/courses"
            element={<Courses />}
          />
        </Route>
      </Route>

      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;