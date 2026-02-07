import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./styles.css";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const STORAGE_KEY = "journal_entries_v1";

/* --- Logo (book + smile) --- */
function ReflektLogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5.2"
        y="5.0"
        width="13.6"
        height="14.0"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <line
        x1="9"
        y1="5.0"
        x2="9"
        y2="19.0"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.75"
      />
      <path
        d="M10.3 13.7c.7.7 1.3 1 1.7 1s1-.3 1.7-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 13a8 8 0 1 1 16 0v7a1 1 0 0 1-1 1h-5v-7h-4v7H5a1 1 0 0 1-1-1v-7Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M9 11.5a3 3 0 0 1 6 0V13H9v-1.5Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

function Tabs() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isDash = location.pathname.startsWith("/dashboard");

  return (
    <div className="top-tabs">
      <div className="tabs-wrap">
        <div className="tabs">
          <Link className={`tab ${isHome ? "is-active" : ""}`} to="/">
            <HomeIcon />
            <span className="tab-label">Home</span>
          </Link>

          <Link className={`tab ${isDash ? "is-active" : ""}`} to="/dashboard">
            <DashboardIcon />
            <span className="tab-label">Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Normalize any older entry shapes into a consistent v1 shape */
function normalizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;

  const createdAt =
    raw.createdAt ||
    raw.dateISO ||
    raw.date ||
    raw.created_at || // just in case future db shape
    new Date().toISOString();

  const updatedAt =
    raw.updatedAt ||
    raw.updated_at ||
    createdAt;

  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "untitled";

  const text = typeof raw.text === "string" ? raw.text : "";

  const aiRaw = raw.ai && typeof raw.ai === "object" ? raw.ai : {};
  const ai = {
    sentimentScore:
      typeof aiRaw.sentimentScore === "number" ? aiRaw.sentimentScore : null,
    suggestedMood:
      typeof aiRaw.suggestedMood === "string" ? aiRaw.suggestedMood : null,
    themes: Array.isArray(aiRaw.themes) ? aiRaw.themes.slice(0, 3) : [],
  };

  return {
    id: raw.id || makeId(),
    title,
    text,
    createdAt,
    updatedAt,
    ai,
  };
}

export default function App() {
  const [entries, setEntries] = useState([]);

  // Load once (and normalize)
  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
      const parsed = saved ? safeParse(saved, []) : [];
      if (!Array.isArray(parsed)) return;

      const normalized = parsed
        .map(normalizeEntry)
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setEntries(normalized);
    } catch (e) {
      console.warn("Failed to load entries", e);
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to save entries", e);
    }
  }, [entries]);

  // CRUD
  const addEntry = (data) => {
    const now = new Date().toISOString();

    const newEntry = normalizeEntry({
      id: makeId(),
      title: (data?.title || "").trim() || "untitled",
      text: (data?.text || "").trim(),
      createdAt: now,
      updatedAt: now,
      ai: {
        sentimentScore:
          typeof data?.sentimentScore === "number" ? data.sentimentScore : null,
        suggestedMood: typeof data?.suggestedMood === "string" ? data.suggestedMood : null,
        themes: Array.isArray(data?.themes) ? data.themes.slice(0, 3) : [],
      },
    });

    setEntries((prev) => [newEntry, ...prev]);
  };

  const updateEntry = (id, patch) => {
    const now = new Date().toISOString();

    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;

        // Lock createdAt: never allow patches to change it
        const safePatch = { ...patch };
        delete safePatch.createdAt;
        delete safePatch.date;
        delete safePatch.dateISO;

        const nextTitle =
          typeof safePatch.title === "string"
            ? safePatch.title.trim() || "untitled"
            : e.title;

        const nextText =
          typeof safePatch.text === "string" ? safePatch.text : e.text;

        const nextAi =
          safePatch.ai && typeof safePatch.ai === "object"
            ? {
                sentimentScore:
                  typeof safePatch.ai.sentimentScore === "number"
                    ? safePatch.ai.sentimentScore
                    : e.ai?.sentimentScore ?? null,
                suggestedMood:
                  typeof safePatch.ai.suggestedMood === "string"
                    ? safePatch.ai.suggestedMood
                    : e.ai?.suggestedMood ?? null,
                themes: Array.isArray(safePatch.ai.themes)
                  ? safePatch.ai.themes.slice(0, 3)
                  : e.ai?.themes ?? [],
              }
            : e.ai || { sentimentScore: null, suggestedMood: null, themes: [] };

        return {
          ...e,
          ...safePatch,
          title: nextTitle,
          text: nextText,
          ai: nextAi,
          updatedAt: now,
        };
      })
    );
  };

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <nav className="nav">
            <Link to="/" className="nav-brand" aria-label="Reflekt home">
              <span className="brand-logo" aria-hidden="true">
                <ReflektLogoMark />
              </span>
              <span className="brand-name">Reflekt</span>
            </Link>
          </nav>
        </header>

        <Tabs />

        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  entries={entries}
                  onAddEntry={addEntry}
                  onUpdateEntry={updateEntry}
                  onDeleteEntry={deleteEntry}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  entries={entries}
                  onUpdateEntry={updateEntry}
                  onDeleteEntry={deleteEntry}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          © {new Date().getFullYear()} Reflekt
        </footer>
      </div>
    </BrowserRouter>
  );
}