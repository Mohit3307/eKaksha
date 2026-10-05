import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAssignmentsByCourse, getCourseById } from "../../services/api";

import type { Assignment } from "../../types/assignment";
import type { Course } from "../../types/course";

import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";

function Assignments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isTeacher = user?.role === "teacher";

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAssignments = async () => {
      if (!id) {
        setError("Course ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [courseData, assignmentData] = await Promise.all([
          getCourseById(id),
          getAssignmentsByCourse(id),
        ]);

        setCourse(courseData);
        setAssignments(assignmentData);
      } catch (error: any) {
        setError(
          error.response?.data?.message || "Unable to load assignments.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="assignments-page">
        <div className="error-box">
          <h2>Unable to load assignments</h2>
          <p>{error}</p>

          <button
            className="secondary-button"
            onClick={() => navigate(`/courses/${id}`)}
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignments-page">
      {/* Header */}

      <section className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(`/courses/${id}`)}
          >
            ← Back to Course
          </button>

          <p className="page-eyebrow">{course?.title || "Course"}</p>

          <h1>Assignments</h1>

          <p>View and manage assignments for this course.</p>
        </div>

        {isTeacher && (
          <div className="page-header-actions">
            <button
              className="primary-button"
              onClick={() => navigate(`/courses/${id}/assignments/create`)}
            >
              + Create Assignment
            </button>
          </div>
        )}
      </section>

      {/* Assignment list */}

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          message={
            isTeacher
              ? "Create your first assignment for this course."
              : "Your teacher has not created any assignments yet."
          }
          action={
            isTeacher ? (
              <button
                className="primary-button"
                onClick={() => navigate(`/courses/${id}/assignments/create`)}
              >
                Create Assignment
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="assignment-grid">
          {assignments.map((assignment) => (
            <div
              className="assignment-card"
              key={assignment._id}
              onClick={() => navigate(`/assignments/${assignment._id}`)}
            >
              <div className="assignment-card-top">
                <div className="assignment-icon">📝</div>

                <span className="assignment-marks">
                  {assignment.totalMarks} marks
                </span>
              </div>

              <h2>{assignment.title}</h2>

              <p className="assignment-description">
                {assignment.description || "No description available."}
              </p>

              <div className="assignment-card-footer">
                <div>
                  <span>Due date</span>

                  <strong>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </strong>
                </div>

                <span className="assignment-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Assignments;
