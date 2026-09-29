import { useNavigate } from "react-router-dom";

interface NavbarProps {
  onMenuClick?: () => void;
}

function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          type="button"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="navbar-brand">
          <span className="brand-icon">
            🎓
          </span>

          <span>eKaksha</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="user-avatar">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="navbar-user-info">
            <strong>
              {user?.name || "User"}
            </strong>

            <span>
              {user?.role || "student"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;