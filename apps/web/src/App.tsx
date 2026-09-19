import { useState } from "react";
import ChatSimulator from "./components/ChatSimulator";
import Dashboard from "./components/Dashboard";
import "./App.css";

type Tab = "chat" | "dashboard";

function App() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Kenza</span>
        <nav className="tabs">
          <button
            className={`tab ${tab === "chat" ? "active" : ""}`}
            onClick={() => setTab("chat")}
          >
            Simulateur de chat
          </button>
          <button
            className={`tab ${tab === "dashboard" ? "active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            Tableau de bord
          </button>
        </nav>
      </header>
      <main className="content">
        {tab === "chat" ? <ChatSimulator /> : <Dashboard />}
      </main>
    </div>
  );
}

export default App;