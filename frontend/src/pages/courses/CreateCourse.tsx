import { useState } from "react";
import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { createCourse } from "../../services/api";

function CreateCourse() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Course title is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createCourse({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
      });

      navigate("/courses");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to create the course. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <section className="page-header">
        <div>
          <p className="page-eyebrow">Courses</p>
          <h1>Create Course</h1>
          <p>Create a new course and start managing your classroom.</p>
        </div>
      </section>

      <div className="form-card">
        <div className="form-card-header">
          <h2>Course Information</h2>
          <p>Enter the basic information for your new course.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Course Title</label>

            <input
              id="title"
              type="text"
              placeholder="e.g. Web Development"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>

            <textarea
              id="description"
              placeholder="Describe what students will learn in this course..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>

            <input
              id="category"
              type="text"
              placeholder="e.g. Computer Science"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/courses")}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
