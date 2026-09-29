import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CourseCard from "../components/CourseCard";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";

import { getMyCourses } from "../services/api";
import type { Course } from "../types/course";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyCourses();

        setCourses(data);
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          "Unable to load your courses.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const activeCourses = courses.filter(
    (course) => course.status === "active"
  );

  const archivedCourses = courses.filter(
    (course) => course.status === "archived"
  );

  return (
    <div className="dashboard-page">
      {/* Header */}
      <section className="dashboard-header">
        <div>
          <p className="page-eyebrow">
            Dashboard
          </p>

          <h1>
            Welcome back,{" "}
            {user?.name || "User"} 👋
          </h1>

          <p className="dashboard-subtitle">
            Here's what's happening with your
            learning today.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {user?.role === "teacher" ? (
            <button
              className="primary-button"
              onClick={() =>
                navigate("/courses/create")
              }
            >
              + Create Course
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() =>
                navigate("/courses/join")
              }
            >
              + Join Course
            </button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            📚
          </div>

          <div>
            <span>Total Courses</span>
            <strong>{courses.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ✅
          </div>

          <div>
            <span>Active Courses</span>
            <strong>{activeCourses.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            📦
          </div>

          <div>
            <span>Archived</span>
            <strong>
              {archivedCourses.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            👤
          </div>

          <div>
            <span>Account Type</span>
            <strong className="stat-role">
              {user?.role === "teacher"
                ? "Teacher"
                : "Student"}
            </strong>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>My Courses</h2>
            <p>
              {user?.role === "teacher"
                ? "Courses you are teaching."
                : "Courses you are enrolled in."}
            </p>
          </div>

          {courses.length > 0 && (
            <button
              className="text-button"
              onClick={() =>
                navigate("/courses")
              }
            >
              View all →
            </button>
          )}
        </div>

        {loading && <Loading />}

        {!loading && error && (
          <div className="error-box">
            <strong>
              Unable to load courses
            </strong>

            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <EmptyState
              title="No courses yet"
              message={
                user?.role === "teacher"
                  ? "Create your first course to get started."
                  : "Join a course using the course join code."
              }
              action={
                user?.role === "teacher" ? (
                  <button
                    className="primary-button"
                    onClick={() =>
                      navigate(
                        "/courses/create"
                      )
                    }
                  >
                    Create Course
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    onClick={() =>
                      navigate(
                        "/courses/join"
                      )
                    }
                  >
                    Join Course
                  </button>
                )
              }
            />
          )}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <div className="course-grid">
              {courses
                .slice(0, 6)
                .map((course) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                  />
                ))}
            </div>
          )}
      </section>
    </div>
  );
}

export default Dashboard;