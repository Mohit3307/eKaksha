import { useState } from "react";
import type { FormEventHandler } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import type { UserRole } from "../types/auth";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  
const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
  event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerUser({
        name,
        email,
        password,
        role,
      });

      navigate("/login");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>eKaksha</h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>

            <select
              id="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as UserRole)
              }
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;