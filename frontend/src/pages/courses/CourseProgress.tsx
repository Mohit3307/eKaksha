import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById, getCourseProgress } from "../../services/api";
import type { Course } from "../../types/course";

interface AssignmentProgress {
  assignmentId: string;
  title: string;
  totalMarks: number;
  dueDate: string;
  submitted: boolean;
  isLate: boolean;
  grade: number | null;
  feedback: string;
  gradedAt: string | null;
}

interface StudentProgress {
  courseId: string;
  totalAssignments: number;
  submittedCount: number;
  gradedCount: number;
  submissionPercentage: number;
  marksObtained: number;
  totalGradedMarks: number;
  gradePercentage: number;
  assignmentProgress: AssignmentProgress[];
}

interface TeacherProgress {
  courseId: string;
  totalAssignments: number;
  submissions: Array<{
    _id: string;
    student:
      | {
          _id: string;
          name: string;
          email: string;
        }
      | string;
    assignment: string;
    grade: number | null;
  }>;
}

function CourseProgress() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<
    StudentProgress | TeacherProgress | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }

    loadProgress(courseId);
  }, [courseId]);

  const loadProgress = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const [courseData, progressData] = await Promise.all([
        getCourseById(id),
        getCourseProgress(id),
      ]);

      setCourse(courseData);
      setProgress(progressData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load course progress. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Course Progress</h1>
            <p>Loading progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course || !progress) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Course Progress</h1>
            <p>{error || "Progress data is unavailable."}</p>
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

  const studentProgress = !isTeacher
    ? (progress as StudentProgress)
    : null;

  const teacherProgress = isTeacher
    ? (progress as TeacherProgress)
    : null;

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

          <h1>Course Progress</h1>
          <p>{course.title}</p>
        </div>
      </div>

      {isTeacher && teacherProgress ? (
        <>
          <div className="progress-summary-grid">
            <div className="progress-stat-card">
              <span>Total Assignments</span>
              <strong>{teacherProgress.totalAssignments}</strong>
            </div>

            <div className="progress-stat-card">
              <span>Total Submissions</span>
              <strong>{teacherProgress.submissions.length}</strong>
            </div>

            <div className="progress-stat-card">
              <span>Students</span>
              <strong>{course.students?.length || 0}</strong>
            </div>
          </div>

          <section className="details-card">
            <h2>Student Submissions</h2>

            {teacherProgress.submissions.length ? (
              <div className="progress-submission-list">
                {teacherProgress.submissions.map((submission) => {
                  const student =
                    typeof submission.student === "string"
                      ? null
                      : submission.student;

                  return (
                    <div
                      className="progress-submission-item"
                      key={submission._id}
                    >
                      <div>
                        <strong>
                          {student?.name || "Student"}
                        </strong>

                        {student?.email && (
                          <span>{student.email}</span>
                        )}
                      </div>

                      <strong>
                        {submission.grade !== null
                          ? `${submission.grade}`
                          : "Not graded"}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="progress-empty">
                No submissions have been received yet.
              </p>
            )}
          </section>
        </>
      ) : (
        studentProgress && (
          <>
            <div className="progress-summary-grid">
              <div className="progress-stat-card">
                <span>Assignments</span>
                <strong>
                  {studentProgress.submittedCount} /{" "}
                  {studentProgress.totalAssignments}
                </strong>
                <small>
                  {studentProgress.submissionPercentage}% submitted
                </small>
              </div>

              <div className="progress-stat-card">
                <span>Graded</span>
                <strong>{studentProgress.gradedCount}</strong>
                <small>
                  {studentProgress.gradePercentage}% performance
                </small>
              </div>

              <div className="progress-stat-card">
                <span>Marks</span>
                <strong>
                  {studentProgress.marksObtained} /{" "}
                  {studentProgress.totalGradedMarks}
                </strong>
                <small>Based on graded assignments</small>
              </div>
            </div>

            <section className="details-card">
              <h2>Assignment Progress</h2>

              {studentProgress.assignmentProgress.length ? (
                <div className="progress-assignment-list">
                  {studentProgress.assignmentProgress.map(
                    (assignment) => (
                      <div
                        className="progress-assignment-item"
                        key={assignment.assignmentId}
                      >
                        <div className="progress-assignment-main">
                          <strong>{assignment.title}</strong>

                          <span>
                            Due{" "}
                            {new Date(
                              assignment.dueDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="progress-assignment-status">
                          {!assignment.submitted ? (
                            <span className="progress-status pending">
                              Pending
                            </span>
                          ) : assignment.grade === null ? (
                            <span className="progress-status submitted">
                              Submitted
                            </span>
                          ) : (
                            <span className="progress-status graded">
                              {assignment.grade} /{" "}
                              {assignment.totalMarks}
                            </span>
                          )}

                          {assignment.isLate && (
                            <small>Late</small>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="progress-empty">
                  No assignments have been created for this course yet.
                </p>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}

export default CourseProgress;