import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className={`app-layout ${sidebarOpen ? "sidebar-visible" : "sidebar-hidden"}`}
    >
      <Navbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
