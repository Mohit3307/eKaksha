import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CourseCard from "../../components/CourseCard";
import EmptyState from "../../components/EmptyState";
import Loading from "../../components/Loading";

import { getMyCourses } from "../../services/api";
import type { Course } from "../../types/course";

function Courses() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [courses, setCourses] = useState<Course[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await getMyCourses();

        setCourses(data);
      } catch (error: any) {
        setError(
          error.response?.data?.message ||
            "Unable to load courses."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <div className="courses-page">
      <section className="page-header">
        <div>
          <p className="page-eyebrow">
            Learning
          </p>

          <h1>My Courses</h1>

          <p>
            Manage and access all your courses
            from one place.
          </p>
        </div>

        <div className="page-header-actions">
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

      {loading && <Loading />}

      {!loading && error && (
        <div className="error-box">
          <strong>
            Unable to load courses
          </strong>

          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        courses.length === 0 && (
          <EmptyState
            title="No courses found"
            message={
              user?.role === "teacher"
                ? "Create your first course to begin teaching."
                : "Join a course using the course join code."
            }
          />
        )}

      {!loading &&
        !error &&
        courses.length > 0 && (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export default Courses;