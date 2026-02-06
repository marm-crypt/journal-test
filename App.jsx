import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Very simple journaling app state stored in localStorage
const STORAGE_KEY = "journal_entries_v1";

export default function App() {
  const [entries, setEntries] = useState([]);

  // Load saved entries
  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load entries", e);
    }
  }, []);

  // Persist entries
  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to save entries", e);
    }
  }, [entries]);

  const addEntry = (data) => {
    const newEntry = {
      id: globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: data.text.trim(),
      mood: data.mood,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const stats = useMemo(() => {
    const total = entries.length;
    const moodCounts = entries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {});
    return { total, moodCounts };
  }, [entries]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <nav className="nav">
            <Link className="nav-brand" to="/">Simple Journal</Link>
            <div className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home entries={entries} onAddEntry={addEntry} />} />
            <Route path="/dashboard" element={<Dashboard entries={entries} stats={stats} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">© {new Date().getFullYear()} Simple Journal</footer>
      </div>
    </BrowserRouter>
  );
}
