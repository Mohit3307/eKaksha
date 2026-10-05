import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  submitAssignment,
  uploadAssignmentAttachment,
  uploadFile,
  deleteFile,
  getFileUrl,
  validateUploadFile,
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [submissionMessage, setSubmissionMessage] = useState("");

  const [uploadingAssignmentAttachment, setUploadingAssignmentAttachment] =
    useState(false);

  const [assignmentAttachmentMessage, setAssignmentAttachmentMessage] =
    useState("");

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

  const handleSelectSubmissionFiles = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setError("");

    for (const file of files) {
      const validationError = validateUploadFile(file);

      if (validationError) {
        setError(`${file.name}: ${validationError}`);
        event.target.value = "";
        return;
      }
    }

    setSelectedFiles(files);

    event.target.value = "";
  };

  const handleRemoveSelectedFile = (fileName: string) => {
    setSelectedFiles((previous) =>
      previous.filter((file) => file.name !== fileName),
    );
  };

  const handleSubmitAssignment = async () => {
    if (!id || !assignment) {
      setError("Assignment information is missing.");
      return;
    }

    if (!answer.trim() && selectedFiles.length === 0) {
      setError(
        "Please enter an answer or attach at least one file before submitting.",
      );
      return;
    }

    const courseId =
      typeof assignment.course === "string"
        ? assignment.course
        : assignment.course?._id;

    if (!courseId) {
      setError("Course information is missing.");
      return;
    }

    let uploadedFileIds: string[] = [];

    try {
      setSubmitting(true);
      setError("");
      setSubmissionMessage("");

      /*
       * Upload selected files first.
       *
       * The generic GridFS endpoint does not require
       * a submission to exist yet, so the returned file IDs
       * can be included in the initial submission.
       */
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadedFile = await uploadFile(file, courseId, id);

          uploadedFileIds.push(uploadedFile.fileId);
        }
      }

      const submission = await submitAssignment(id, {
        textResponse: answer.trim(),
        attachments: uploadedFileIds,
      });

      setMySubmission(submission);

      setSelectedFiles([]);

      setSubmissionMessage("Assignment submitted successfully.");
    } catch (error: any) {
      /*
       * If file upload succeeded but submission failed,
       * clean up those files so we do not leave orphaned
       * GridFS files behind.
       */
      if (uploadedFileIds.length > 0) {
        await Promise.all(
          uploadedFileIds.map(async (fileId) => {
            try {
              await deleteFile(fileId);
            } catch {
              // Ignore cleanup errors.
            }
          }),
        );
      }

      setError(error.response?.data?.message || "Unable to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentAttachmentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !id) {
      return;
    }

    const validationError = validateUploadFile(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      setUploadingAssignmentAttachment(true);
      setError("");
      setAssignmentAttachmentMessage("");

      await uploadAssignmentAttachment(id, file);

      const updatedAssignment = await getAssignment(id);

      setAssignment(updatedAssignment);

      setAssignmentAttachmentMessage(`"${file.name}" uploaded successfully.`);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to upload assignment attachment.",
      );
    } finally {
      setUploadingAssignmentAttachment(false);
      event.target.value = "";
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

      {assignmentAttachmentMessage && (
        <div className="success-box">{assignmentAttachmentMessage}</div>
      )}

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
                <div className="attachment-item" key={attachment}>
                  <span>📎</span>

                  <span>Assignment Attachment {index + 1}</span>

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
            <p className="no-attachments">
              No attachments for this assignment.
            </p>
          )}

          {isTeacher && (
            <div className="assignment-attachment-upload">
              <label htmlFor="assignment-attachment">
                Add Assignment Attachment
              </label>

              <input
                id="assignment-attachment"
                type="file"
                onChange={handleAssignmentAttachmentUpload}
                disabled={uploadingAssignmentAttachment}
              />

              <small>
                PDF, images, Word, PowerPoint, and text files up to 10 MB.
              </small>

              {uploadingAssignmentAttachment && (
                <p className="upload-status">Uploading attachment...</p>
              )}
            </div>
          )}
        </div>

        {/* STUDENT VIEW */}
        {isStudent && (
          <div className="assignment-submission-section">
            <div className="submission-header">
              <div>
                <h2>My Submission</h2>

                <p>Submit your answer and optional files together.</p>
              </div>

              {mySubmission && (
                <span className="submission-success-badge">Submitted</span>
              )}
            </div>

            {submissionLoading ? (
              <Loading />
            ) : mySubmission ? (
              <>
                {submissionMessage && (
                  <div className="success-box">{submissionMessage}</div>
                )}

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

                <div className="submission-attachments-section">
                  <h3>Submission Attachments</h3>

                  {mySubmission.attachments &&
                  mySubmission.attachments.length > 0 ? (
                    <div className="assignment-attachments">
                      {mySubmission.attachments.map((attachment, index) => (
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

                  <div className="submission-file-upload">
                    <label htmlFor="submission-files">Attach Files</label>

                    <input
                      id="submission-files"
                      type="file"
                      multiple
                      onChange={handleSelectSubmissionFiles}
                      disabled={submitting}
                    />

                    <small>
                      PDF, images, Word, PowerPoint, and text files up to 10 MB
                      each.
                    </small>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="selected-submission-files">
                      <h3>Selected Files</h3>

                      {selectedFiles.map((file) => (
                        <div
                          className="selected-file-item"
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                        >
                          <span>📎 {file.name}</span>

                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleRemoveSelectedFile(file.name)}
                            disabled={submitting}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="submission-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleSubmitAssignment}
                      disabled={submitting}
                    >
                      {submitting
                        ? selectedFiles.length > 0
                          ? "Uploading & Submitting..."
                          : "Submitting..."
                        : "Submit Assignment"}
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
                          onClick={() =>
                            navigate(
                              `/assignments/${id}/submissions/${submission._id}`,
                            )
                          }
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
