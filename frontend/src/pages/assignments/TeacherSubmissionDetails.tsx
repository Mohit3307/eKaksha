import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getFileUrl,
} from "../../services/api";

import type { Assignment, Submission } from "../../types/assignment";

import Loading from "../../components/Loading";

function TeacherSubmissionDetails() {
  const { assignmentId, submissionId } = useParams<{
    assignmentId: string;
    submissionId: string;
  }>();

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isTeacher = user?.role === "teacher";

  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [submission, setSubmission] = useState<Submission | null>(null);

  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadSubmission = async () => {
      if (!assignmentId || !submissionId) {
        setError("Submission information is missing.");
        setLoading(false);
        return;
      }

      if (!isTeacher) {
        setError("Only teachers can view this page.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [assignmentData, submissions] = await Promise.all([
          getAssignment(assignmentId),
          getAssignmentSubmissions(assignmentId),
        ]);

        const selectedSubmission = submissions.find(
          (item) => item._id === submissionId,
        );

        if (!selectedSubmission) {
          setError("Submission not found.");
          return;
        }

        setAssignment(assignmentData);
        setSubmission(selectedSubmission);

        if (selectedSubmission.grade !== null) {
          setGrade(String(selectedSubmission.grade));
        }

        setFeedback(selectedSubmission.feedback || "");
      } catch (error: any) {
        setError(error.response?.data?.message || "Unable to load submission.");
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [assignmentId, submissionId, isTeacher]);

  const handleSaveGrade = async () => {
    if (!submissionId || !assignment) {
      setError("Submission information is missing.");
      return;
    }

    if (!grade.trim()) {
      setError("Please enter a grade.");
      return;
    }

    const numericGrade = Number(grade);

    if (Number.isNaN(numericGrade)) {
      setError("Grade must be a valid number.");
      return;
    }

    if (numericGrade < 0) {
      setError("Grade cannot be negative.");
      return;
    }

    if (numericGrade > assignment.totalMarks) {
      setError(`Grade cannot be greater than ${assignment.totalMarks}.`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const updatedSubmission = await gradeSubmission(submissionId, {
        grade: numericGrade,
        feedback: feedback.trim(),
      });

      setSubmission(updatedSubmission);

      setGrade(String(updatedSubmission.grade ?? numericGrade));

      setFeedback(updatedSubmission.feedback || "");

      setSuccessMessage("Grade and feedback saved successfully.");
    } catch (error: any) {
      setError(error.response?.data?.message || "Unable to save grade.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAttachment = (fileId: string) => {
    if (!localStorage.getItem("token")) {
      setError("You are not logged in.");
      return;
    }

    window.open(getFileUrl(fileId), "_blank");
  };

  const handleDownloadAttachment = (fileId: string) => {
    if (!localStorage.getItem("token")) {
      setError("You are not logged in.");
      return;
    }

    const downloadLink = document.createElement("a");

    downloadLink.href = getFileUrl(fileId);
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !submission) {
    return (
      <div className="assignment-details-page">
        <div className="error-box">
          <h2>Unable to load submission</h2>

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

  if (!assignment || !submission) {
    return (
      <div className="assignment-details-page">
        <div className="error-box">
          <h2>Submission not found</h2>

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

  const student =
    typeof submission.student === "string" ? null : submission.student;

  return (
    <div className="teacher-submission-page">
      <section className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back to Submissions
          </button>

          <p className="page-eyebrow">{assignment.title}</p>

          <h1>Student Submission</h1>

          <p>Review the student's answer and assign a grade.</p>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      {successMessage && <div className="success-box">{successMessage}</div>}

      <section className="teacher-submission-details-card">
        <div className="student-submission-header">
          <div className="student-avatar large">
            {student?.name?.charAt(0).toUpperCase() || "S"}
          </div>

          <div>
            <h2>{student?.name || "Student"}</h2>

            <p>{student?.email || "Email unavailable"}</p>
          </div>
        </div>

        <div className="submission-status-grid">
          <div>
            <span className="assignment-detail-label">Submitted At</span>

            <strong className="assignment-detail-value">
              {new Date(submission.submittedAt).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="assignment-detail-label">Submission Status</span>

            <strong
              className={`submission-status-value ${
                submission.isLate ? "late" : "on-time"
              }`}
            >
              {submission.isLate ? "Late" : "On Time"}
            </strong>
          </div>

          <div>
            <span className="assignment-detail-label">Total Marks</span>

            <strong className="assignment-detail-value">
              {assignment.totalMarks}
            </strong>
          </div>
        </div>

        <div className="teacher-answer-section">
          <h2>Student Answer</h2>

          <div className="teacher-answer-box">
            {submission.textResponse || "No text response submitted."}
          </div>
        </div>

        <div className="teacher-attachments-section">
          <h2>Attachments</h2>

          {submission.attachments && submission.attachments.length > 0 ? (
            <div className="assignment-attachments">
              {submission.attachments.map((attachment, index) => (
                <div className="attachment-item" key={attachment}>
                  <span>📎</span>

                  <span>Submission Attachment {index + 1}</span>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleOpenAttachment(attachment)}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-attachments">No attachments submitted.</p>
          )}
        </div>

        <div className="grading-section">
          <div className="grading-section-header">
            <div>
              <h2>Grade Submission</h2>

              <p>Enter a grade and optional feedback for the student.</p>
            </div>

            {submission.grade !== null && (
              <span className="graded-badge">Graded</span>
            )}
          </div>

          <div className="grade-input-row">
            <div className="form-group">
              <label htmlFor="grade">Grade</label>

              <div className="grade-input-wrapper">
                <input
                  id="grade"
                  type="number"
                  min="0"
                  max={assignment.totalMarks}
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  placeholder="Enter grade"
                  disabled={saving}
                />

                <span>/ {assignment.totalMarks}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Feedback</label>

            <textarea
              id="feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Write feedback for the student..."
              rows={6}
              disabled={saving}
            />
          </div>

          <div className="grading-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleSaveGrade}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeacherSubmissionDetails;
