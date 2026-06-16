import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} />
      <div className="main">
        {page === "dashboard" ? <Dashboard /> : <Chat />}
      </div>
    </div>
  );
}

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        NovaBite
      </div>
      <div className="sidebar-tagline">Sales Intelligence</div>

      <div className="nav-label">Navigate</div>

      <button
        className={`nav-item ${page === "dashboard" ? "active" : ""}`}
        onClick={() => setPage("dashboard")}
      >
        <span className="icon">▦</span>
        Dashboard
      </button>

      <button
        className={`nav-item ${page === "chat" ? "active" : ""}`}
        onClick={() => setPage("chat")}
      >
        <span className="icon">◎</span>
        Ask AI
      </button>
    </aside>
  );
}
