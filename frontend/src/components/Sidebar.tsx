import { NavLink } from "react-router-dom";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function Sidebar({
  open = true,
  onClose,
}: SidebarProps) {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role;

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          open ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <h2>eKaksha</h2>
            <p>Learning Platform</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className="sidebar-link"
            onClick={onClose}
          >
            <span>🏠</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/courses"
            className="sidebar-link"
            onClick={onClose}
          >
            <span>📚</span>
            My Courses
          </NavLink>

          {role === "teacher" && (
            <NavLink
              to="/courses/create"
              className="sidebar-link"
              onClick={onClose}
            >
              <span>➕</span>
              Create Course
            </NavLink>
          )}

          {role === "student" && (
            <NavLink
              to="/courses/join"
              className="sidebar-link"
              onClick={onClose}
            >
              <span>🔗</span>
              Join Course
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className="sidebar-link"
            onClick={onClose}
          >
            <span>👤</span>
            Profile
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-role">
            <span>Current role</span>
            <strong>
              {role === "teacher"
                ? "Teacher"
                : "Student"}
            </strong>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;