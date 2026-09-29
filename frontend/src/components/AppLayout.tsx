import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;