import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  submitAssignment,
} from "../../services/api";

import type { Assignment, Submission } from "../../types/assignment";

import Loading from "../../components/Loading";

function AssignmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const [error, setError] = useState("");

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  useEffect(() => {
    const loadAssignment = async () => {
      if (!id) {
        setError("Assignment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const assignmentData = await getAssignment(id);

        setAssignment(assignmentData);

        if (isStudent) {
          setSubmissionLoading(true);

          const studentSubmissions = await getMySubmissions();

          const existingSubmission = studentSubmissions.find((submission) => {
            if (typeof submission.assignment === "string") {
              return submission.assignment === id;
            }

            return submission.assignment?._id === id;
          });

          if (existingSubmission) {
            setMySubmission(existingSubmission);

            setAnswer(existingSubmission.textResponse || "");
          }
        }

        if (isTeacher) {
          setSubmissionLoading(true);

          const assignmentSubmissions = await getAssignmentSubmissions(id);

          setSubmissions(assignmentSubmissions);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Unable to load assignment.");
      } finally {
        setSubmissionLoading(false);
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id, isStudent, isTeacher]);

  const handleSubmitAssignment = async () => {
    if (!id) {
      setError("Assignment ID is missing.");
      return;
    }

    if (!answer.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSubmissionMessage("");

      const submission = await submitAssignment(id, {
        textResponse: answer.trim(),
        attachments: [],
      });

      setMySubmission(submission);

      setSubmissionMessage("Assignment submitted successfully.");
    } catch (error: any) {
      setError(error.response?.data?.message || "Unable to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !assignment) {
    return (
      <div className="assignment-details-page">
        <div className="error-box">
          <h2>Unable to load assignment</h2>

          <p>{error}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="assignment-details-page">
        <div className="error-box">
          <h2>Assignment not found</h2>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-details-page">
      <section className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <p className="page-eyebrow">Assignment</p>

          <h1>{assignment.title}</h1>

          <p>View assignment details and submission information.</p>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="assignment-details-card">
        <div className="assignment-details-top">
          <div>
            <span className="assignment-detail-label">Total Marks</span>

            <strong className="assignment-detail-value">
              {assignment.totalMarks}
            </strong>
          </div>

          <div>
            <span className="assignment-detail-label">Due Date</span>

            <strong className="assignment-detail-value">
              {new Date(assignment.dueDate).toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="assignment-detail-section">
          <h2>Description</h2>

          <p>{assignment.description || "No description available."}</p>
        </div>

        <div className="assignment-detail-section">
          <h2>Attachments</h2>

          {assignment.attachments && assignment.attachments.length > 0 ? (
            <div className="assignment-attachments">
              {assignment.attachments.map((attachment, index) => (
                <div className="attachment-item" key={index}>
                  <span>📎</span>

                  <span>{attachment}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-attachments">
              No attachments for this assignment.
            </p>
          )}
        </div>

        {/* STUDENT VIEW */}
        {isStudent && (
          <div className="assignment-submission-section">
            <div className="submission-header">
              <div>
                <h2>My Submission</h2>

                <p>View your submission status, answer, grade, and feedback.</p>
              </div>

              {mySubmission && (
                <span className="submission-success-badge">Submitted</span>
              )}
            </div>

            {submissionLoading ? (
              <Loading />
            ) : mySubmission ? (
              <>
                <div className="submission-status-grid">
                  <div>
                    <span className="assignment-detail-label">
                      Submitted At
                    </span>

                    <strong className="assignment-detail-value">
                      {new Date(mySubmission.submittedAt).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span className="assignment-detail-label">
                      Submission Status
                    </span>

                    <strong
                      className={`submission-status-value ${
                        mySubmission.isLate ? "late" : "on-time"
                      }`}
                    >
                      {mySubmission.isLate ? "Late" : "On Time"}
                    </strong>
                  </div>

                  <div>
                    <span className="assignment-detail-label">Grade</span>

                    <strong className="assignment-detail-value">
                      {mySubmission.grade === null
                        ? "Pending"
                        : `${mySubmission.grade} / ${assignment.totalMarks}`}
                    </strong>
                  </div>
                </div>

                <div className="submission-answer-section">
                  <h3>Your Answer</h3>

                  <div className="submission-answer-box">
                    {mySubmission.textResponse || "No text response submitted."}
                  </div>
                </div>

                <div className="submission-feedback-section">
                  <h3>Teacher Feedback</h3>

                  <div className="submission-feedback-box">
                    {mySubmission.feedback
                      ? mySubmission.feedback
                      : "No feedback yet."}
                  </div>
                </div>
              </>
            ) : (
              <>
                {submissionMessage && (
                  <div className="success-box">{submissionMessage}</div>
                )}

                <div className="submission-form">
                  <label htmlFor="answer">Your Answer</label>

                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Write your answer here..."
                    rows={8}
                    disabled={submitting}
                  />

                  <div className="submission-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleSubmitAssignment}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TEACHER VIEW */}
        {isTeacher && (
          <div className="teacher-submissions-section">
            <div className="submission-header">
              <div>
                <h2>Student Submissions</h2>

                <p>View submissions from students enrolled in this course.</p>
              </div>

              <span className="submission-count-badge">
                {submissions.length}{" "}
                {submissions.length === 1 ? "Submission" : "Submissions"}
              </span>
            </div>

            {submissionLoading ? (
              <Loading />
            ) : submissions.length === 0 ? (
              <div className="no-submissions-box">
                <h3>No submissions yet</h3>

                <p>Students have not submitted this assignment yet.</p>
              </div>
            ) : (
              <div className="teacher-submissions-list">
                {submissions.map((submission) => {
                  const student =
                    typeof submission.student === "string"
                      ? null
                      : submission.student;

                  return (
                    <div
                      className="teacher-submission-card"
                      key={submission._id}
                    >
                      <div className="teacher-submission-main">
                        <div className="teacher-student-info">
                          <div className="student-avatar">
                            {student?.name?.charAt(0).toUpperCase() || "S"}
                          </div>

                          <div>
                            <h3>{student?.name || "Student"}</h3>

                            <p>{student?.email || "Email unavailable"}</p>
                          </div>
                        </div>

                        <div className="teacher-submission-status">
                          <span
                            className={`submission-status-value ${
                              submission.isLate ? "late" : "on-time"
                            }`}
                          >
                            {submission.isLate ? "Late" : "On Time"}
                          </span>

                          <span className="teacher-submission-time">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="teacher-submission-bottom">
                        <div>
                          <span className="assignment-detail-label">Grade</span>

                          <strong className="assignment-detail-value">
                            {submission.grade === null
                              ? "Pending"
                              : `${submission.grade} / ${assignment.totalMarks}`}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            // Detailed submission view
                            // will be added next.
                          }}
                        >
                          View Submission
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AssignmentDetails;
