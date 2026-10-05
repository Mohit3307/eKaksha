import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createAssignment,
  getCourseById,
} from "../../services/api";

import type { Course } from "../../types/course";

import Loading from "../../components/Loading";

function CreateAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load course information
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
      } catch (error: any) {
        setError(
          error.response?.data?.message ||
            "Unable to load course."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  // Create assignment
  const handleCreateAssignment = async () => {
    if (!id) {
      setError("Course ID is missing.");
      return;
    }

    if (!title.trim()) {
      setError("Assignment title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Assignment description is required.");
      return;
    }

    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    if (!totalMarks || Number(totalMarks) <= 0) {
      setError("Total marks must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createAssignment({
        title: title.trim(),
        description: description.trim(),
        course: id,
        dueDate,
        totalMarks: Number(totalMarks),
        attachments: [],
      });

      navigate(`/courses/${id}/assignments`);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to create assignment."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="create-assignment-page">
      <section className="page-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(`/courses/${id}/assignments`)
            }
          >
            ← Back to Assignments
          </button>

          <p className="page-eyebrow">
            {course?.title || "Course"}
          </p>

          <h1>Create Assignment</h1>

          <p>
            Create a new assignment for your students.
          </p>
        </div>
      </section>

      <section className="form-card">
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">
            Assignment Title
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. React Fundamentals"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe the assignment..."
            rows={6}
            disabled={saving}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate">
              Due Date
            </label>

            <input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalMarks">
              Total Marks
            </label>

            <input
              id="totalMarks"
              type="number"
              min="1"
              value={totalMarks}
              onChange={(event) =>
                setTotalMarks(event.target.value)
              }
              placeholder="100"
              disabled={saving}
            />
          </div>
        </div>

        <div className="attachment-placeholder">
          <div>
            <strong>Attachments</strong>

            <p>
              File attachments will be connected after
              the GridFS upload API is ready.
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(`/courses/${id}/assignments`)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleCreateAssignment}
            disabled={saving}
          >
            {saving
              ? "Creating..."
              : "Create Assignment"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CreateAssignment;