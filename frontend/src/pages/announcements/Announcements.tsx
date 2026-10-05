import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByCourse,
  getCourseById,
  uploadAnnouncementAttachment,
  getFileUrl,
  validateUploadFile,
} from "../../services/api";

import type { Announcement } from "../../types/announcement";
import type { Course } from "../../types/course";

function Announcements() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [uploadingAttachmentId, setUploadingAttachmentId] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isTeacher = currentUser?.role === "teacher";

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }

    loadAnnouncements(courseId);
  }, [courseId]);

  const loadAnnouncements = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const [courseData, announcementData] = await Promise.all([
        getCourseById(id),
        getAnnouncementsByCourse(id),
      ]);

      setCourse(courseData);
      setAnnouncements(announcementData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load announcements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!courseId) {
      setError("Course ID is missing.");
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter an announcement.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const created = await createAnnouncement(courseId, trimmedMessage);

      setAnnouncements((previous) => [created, ...previous]);
      setMessage("");
      setSuccess("Announcement posted successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create announcement. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnnouncementAttachmentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    announcementId: string,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateUploadFile(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      setUploadingAttachmentId(announcementId);
      setError("");
      setSuccess("");

      await uploadAnnouncementAttachment(announcementId, file);

      if (courseId) {
        const updatedAnnouncements = await getAnnouncementsByCourse(courseId);

        setAnnouncements(updatedAnnouncements);
      }

      setSuccess(`"${file.name}" attached successfully.`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to upload announcement attachment.",
      );
    } finally {
      setUploadingAttachmentId(null);
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

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(announcementId);
      setError("");
      setSuccess("");

      await deleteAnnouncement(announcementId);

      setAnnouncements((previous) =>
        previous.filter((announcement) => announcement._id !== announcementId),
      );

      setSuccess("Announcement deleted successfully.");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete announcement. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Announcements</h1>
            <p>Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(`/courses/${courseId}`)}
          >
            ← Back to Course
          </button>

          <h1>Announcements</h1>

          <p>
            {course?.title
              ? `Announcements for ${course.title}`
              : "Course announcements"}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {success && <div className="success-message">{success}</div>}

      {isTeacher && (
        <div className="card announcement-create-card">
          <div className="card-header">
            <h2>Post Announcement</h2>
          </div>

          <form onSubmit={handleCreateAnnouncement}>
            <div className="form-group">
              <label htmlFor="announcement-message">Announcement</label>

              <textarea
                id="announcement-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write an announcement for your students..."
                rows={5}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        </div>
      )}

      <div className="section-header">
        <div>
          <h2>Recent Announcements</h2>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="empty-state">
          <h3>No announcements yet</h3>

          <p>
            {isTeacher
              ? "Post the first announcement for this course."
              : "Your teacher has not posted any announcements yet."}
          </p>
        </div>
      ) : (
        <div className="announcement-list">
          {announcements.map((announcement) => (
            <article className="card announcement-card" key={announcement._id}>
              <div className="announcement-card-header">
                <div>
                  <h3>{announcement.author?.name || "Teacher"}</h3>

                  <p className="announcement-date">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </p>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                    disabled={deletingId === announcement._id}
                  >
                    {deletingId === announcement._id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>

              <div className="announcement-message">{announcement.content}</div>

              <div className="announcement-attachments-section">
                <h4>Attachments</h4>

                {announcement.attachments &&
                announcement.attachments.length > 0 ? (
                  <div className="assignment-attachments">
                    {announcement.attachments.map((attachment, index) => (
                      <div className="attachment-item" key={attachment}>
                        <span>📎</span>

                        <span>Announcement Attachment {index + 1}</span>

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
                  <p className="no-attachments">No attachments.</p>
                )}

                {isTeacher && (
                  <div className="announcement-attachment-upload">
                    <label
                      htmlFor={`announcement-attachment-${announcement._id}`}
                    >
                      Add Attachment
                    </label>

                    <input
                      id={`announcement-attachment-${announcement._id}`}
                      type="file"
                      onChange={(event) =>
                        handleAnnouncementAttachmentUpload(
                          event,
                          announcement._id,
                        )
                      }
                      disabled={uploadingAttachmentId === announcement._id}
                    />

                    <small>
                      PDF, images, Word, PowerPoint, and text files up to 10 MB.
                    </small>

                    {uploadingAttachmentId === announcement._id && (
                      <p className="upload-status">Uploading attachment...</p>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Announcements;
