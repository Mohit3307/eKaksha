import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { archiveCourse, getCourseById } from "../../services/api";
import Loading from "../../components/Loading";
import type { Course } from "../../types/course";

function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isTeacher = user?.role === "teacher";

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) {
        setError("Course ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getCourseById(id);
        setCourse(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Unable to load course details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const handleCopyCode = async () => {
    if (!course?.joinCode) return;

    try {
      await navigator.clipboard.writeText(course.joinCode);
      setCopyMessage("Join code copied!");
    } catch {
      setCopyMessage("Copy failed. Please select and copy the code manually.");
    }
  };

  const handleArchive = async () => {
    if (!course || !id) return;

    const action = course.status === "active" ? "archive" : "restore";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this course?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const updatedCourse = await archiveCourse(id);
      setCourse(updatedCourse);
    } catch (err: any) {
      setError(err.response?.data?.message || `Unable to ${action} course.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !course) {
    return (
      <div className="course-details-page">
        <div className="error-box">
          <h2>Unable to open course</h2>
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => navigate("/courses")}
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="course-details-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/courses")}
      >
        ← Back to Courses
      </button>

      <section className="course-details-header">
        <div className="course-details-heading">
          <div className="course-details-icon">📘</div>

          <div>
            <p className="page-eyebrow">{course.category || "Course"}</p>

            <h1>{course.title}</h1>

            <p className="course-details-description">
              {course.description || "No course description available."}
            </p>
          </div>
        </div>

        <span
          className={`course-status ${
            course.status === "active" ? "active" : "archived"
          }`}
        >
          {course.status === "active" ? "Active" : "Archived"}
        </span>
      </section>

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      <div className="course-details-grid">
        <section className="details-card">
          <h2>Course Information</h2>

          <div className="details-info-row">
            <span>Course Name</span>
            <strong>{course.title}</strong>
          </div>

          <div className="details-info-row">
            <span>Category</span>
            <strong>{course.category || "Not specified"}</strong>
          </div>

          <div className="details-info-row">
            <span>Status</span>
            <strong>
              {course.status === "active" ? "Active" : "Archived"}
            </strong>
          </div>

          <div className="details-info-row">
            <span>Teacher</span>
            <strong>{course.teacher?.name || "Teacher"}</strong>
          </div>

          <div className="details-info-row">
            <span>Enrolled Students</span>
            <strong>{course.students?.length ?? 0}</strong>
          </div>
        </section>

        {isTeacher && (
          <section className="details-card join-code-card">
            <div className="details-card-heading">
              <div>
                <h2>Student Join Code</h2>
                <p>Share this code with students so they can join.</p>
              </div>
              <span className="join-code-icon">🔑</span>
            </div>

            {course.joinCode ? (
              <>
                <div className="join-code-display">
                  <strong>{course.joinCode}</strong>
                </div>

                <button
                  type="button"
                  className="primary-button copy-code-button"
                  onClick={handleCopyCode}
                >
                  <span>▣</span> Copy Join Code
                </button>

                {copyMessage && (
                  <p className="copy-message" role="status">
                    {copyMessage}
                  </p>
                )}
              </>
            ) : (
              <p className="muted-text">
                No join code is available for this course.
              </p>
            )}
          </section>
        )}
      </div>

      <section className="details-card enrolled-students-section">
        <div className="section-heading">
          <div>
            <h2>Enrolled Students</h2>
            <p>Students currently enrolled in this course.</p>
          </div>
          <span className="student-count">
            {course.students?.length ?? 0} students
          </span>
        </div>

        {course.students && course.students.length > 0 ? (
          <div className="student-list">
            {course.students.map((student) => (
              <div className="student-row" key={student._id}>
                <div className="student-avatar">
                  {student.name?.charAt(0).toUpperCase() || "S"}
                </div>

                <div className="student-info">
                  <strong>{student.name}</strong>
                  <span>{student.email}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="students-empty-state">
            <span>👥</span>
            <strong>No students enrolled yet</strong>
            <p>
              {isTeacher
                ? "Share the join code with your students to get started."
                : "There are currently no other students listed in this course."}
            </p>
          </div>
        )}
      </section>

      <section className="details-card assignments-link-card">
        <div>
          <h2>Assignments</h2>

          <p>View assignments, submit your work, and track your submissions.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate(`/courses/${course._id}/assignments`)}
        >
          View Assignments →
        </button>
      </section>
      
      <section className="details-card assignments-link-card">
        <div>
          <h2>Announcements</h2>

          <p>
            View course announcements and important updates from your teacher.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate(`/courses/${course._id}/announcements`)
          }
        >
          View Announcements →
        </button>
        
      </section>
      {isTeacher && (
        <section className="course-management-section">
          <div>
            <h2>Course Management</h2>
            <p>
              {course.status === "active"
                ? "Archive this course if it is no longer active."
                : "Restore this course to make it active again."}
            </p>
          </div>

          <button
            type="button"
            className={
              course.status === "active" ? "danger-button" : "primary-button"
            }
            onClick={handleArchive}
            disabled={actionLoading}
          >
            {actionLoading
              ? "Please wait..."
              : course.status === "active"
                ? "Archive Course"
                : "Restore Course"}
          </button>
        </section>
      )}
    </div>
  );
}

export default CourseDetails;
