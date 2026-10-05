import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById, getUsers, manageRoster } from "../../services/api";
import type { User } from "../../types/auth";
import type { Course } from "../../types/course";

function CourseRoster() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }

    loadRoster(courseId);
  }, [courseId]);

  const loadRoster = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const [courseData, usersData] = await Promise.all([
        getCourseById(id),
        getUsers({ role: "student" }),
      ]);

      setCourse(courseData);
      setStudents(usersData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load course roster. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const enrolledStudentIds = useMemo(() => {
    return new Set(course?.students?.map((student) => student._id) || []);
  }, [course]);

  const availableStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      if (enrolledStudentIds.has(student._id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    });
  }, [students, enrolledStudentIds, search]);

  const handleRosterChange = async (
    studentId: string,
    action: "add" | "remove",
  ) => {
    if (!course) {
      return;
    }

    if (
      action === "remove" &&
      !window.confirm(
        "Are you sure you want to remove this student from the course?",
      )
    ) {
      return;
    }

    try {
      setActionLoading(`${action}-${studentId}`);
      setError("");
      setSuccess("");

      const updatedCourse = await manageRoster(course._id, studentId, action);

      setCourse(updatedCourse);

      setSuccess(
        action === "add"
          ? "Student added to the course successfully."
          : "Student removed from the course successfully.",
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${action} student. Please try again.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Manage Students</h1>
            <p>Loading course roster...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Manage Students</h1>
            <p>You do not have permission to manage this course roster.</p>
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(courseId ? `/courses/${courseId}` : "/courses")
          }
        >
          ← Back to Course
        </button>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Manage Students</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(`/courses/${course._id}`)}
          >
            ← Back to Course
          </button>

          <h1>Manage Students</h1>
          <p>Manage students enrolled in this course.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {success && <div className="success-message">{success}</div>}

      <div className="roster-grid">
        <section className="details-card">
          <div className="roster-card-header">
            <div>
              <h2>Enrolled Students</h2>
              <p>Students currently enrolled in this course.</p>
            </div>

            <span className="roster-count">{course.students?.length || 0}</span>
          </div>

          {course.students?.length ? (
            <div className="roster-student-list">
              {course.students.map((student) => (
                <div className="roster-student-item" key={student._id}>
                  <div className="roster-student-info">
                    <strong>{student.name}</strong>
                    <span>{student.email}</span>
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleRosterChange(student._id, "remove")}
                    disabled={actionLoading === `remove-${student._id}`}
                  >
                    {actionLoading === `remove-${student._id}`
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="roster-empty">
              No students are enrolled in this course yet.
            </p>
          )}
        </section>

        <section className="details-card">
          <div className="roster-card-header">
            <div>
              <h2>Add Students</h2>
              <p>Search for registered students and add them to this course.</p>
            </div>
          </div>

          <div className="roster-search">
            <input
              type="search"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {availableStudents.length ? (
            <div className="roster-student-list">
              {availableStudents.map((student) => (
                <div className="roster-student-item" key={student._id}>
                  <div className="roster-student-info">
                    <strong>{student.name}</strong>
                    <span>{student.email}</span>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleRosterChange(student._id, "add")}
                    disabled={actionLoading === `add-${student._id}`}
                  >
                    {actionLoading === `add-${student._id}`
                      ? "Adding..."
                      : "Add"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="roster-empty">
              {search.trim()
                ? "No matching students found."
                : "No students are available to add."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default CourseRoster;
