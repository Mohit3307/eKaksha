import { useState } from "react";
import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { joinCourse } from "../../services/api";

function JoinCourse() {
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter a course join code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await joinCourse(code);

      setSuccess("You have successfully joined the course!");

      setTimeout(() => {
        navigate("/courses");
      }, 1000);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to join the course. Please check the code and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <section className="page-header">
        <div>
          <p className="page-eyebrow">Learning</p>
          <h1>Join a Course</h1>
          <p>
            Enter the join code shared by your teacher to access a classroom.
          </p>
        </div>
      </section>

      <div className="form-card">
        <div className="form-card-header">
          <h2>Course Join Code</h2>
          <p>Ask your teacher for the unique code to join their course.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="joinCode">Join Code</label>

            <input
              id="joinCode"
              type="text"
              placeholder="e.g. AB12CD"
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value.toUpperCase());
                setError("");
                setSuccess("");
              }}
              maxLength={6}
              autoComplete="off"
              disabled={loading}
            />

            <small className="input-hint">
              Enter the 6-character code provided by your teacher.
            </small>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" role="status">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/courses")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !joinCode.trim()}
            >
              {loading ? "Joining..." : "Join Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinCourse;
