import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/Register";
import "./App.css";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div style={{ padding: "40px" }}>
      <h1>Welcome to eKaksha</h1>

      {user && (
        <>
          <p>Welcome, {user.name}!</p>
          <p>Role: {user.role}</p>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;