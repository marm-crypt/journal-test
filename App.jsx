import React, { useEffect, useState } from "react";
import { NavLink, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { supabase } from "./lib/supabaseClient.js";

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const location = useLocation();
  const hideTabs = location.pathname.startsWith("/auth");

  /* ---------------------------
     Auth session boot
  ---------------------------- */
  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) console.warn("getSession error:", error);
      setSession(data?.session ?? null);
      setBootLoading(false);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* ---------------------------
     Fetch entries
  ---------------------------- */
  async function fetchEntries(userId) {
    if (!userId) {
      setEntries([]);
      return;
    }

    setEntriesLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchEntries error:", e);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }

  // When session changes (login/logout), refresh entries
  useEffect(() => {
    const userId = session?.user?.id;
    fetchEntries(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  /* ---------------------------
     CRUD
  ---------------------------- */
  async function addEntry(entry) {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not signed in.");

    const now = new Date().toISOString();

    const payload = {
      user_id: userId,
      title: entry.title || "untitled",
      content: entry.content,
      mood: entry.mood,
      themes: entry.themes,
      created_at: now,
      updated_at: now,
    };

    // IMPORTANT: select() returns inserted rows back so UI can update immediately
    const { data, error } = await supabase
      .from("journal_entries")
      .insert(payload)
      .select("*");

    if (error) throw error;

    // Optimistic update: prepend inserted row(s)
    const inserted = Array.isArray(data) ? data : [];
    if (inserted.length) {
      setEntries((prev) => [...inserted, ...prev]);
    } else {
      // Fallback: refetch if insert returned nothing
      await fetchEntries(userId);
    }
  }

  async function updateEntry(id, patch) {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not signed in.");

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("journal_entries")
      .update({
        title: patch.title || "untitled",
        content: patch.content,
        mood: patch.mood,
        themes: patch.themes,
        updated_at: now,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*");

    if (error) throw error;

    const updated = Array.isArray(data) ? data[0] : null;

    if (updated) {
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } else {
      await fetchEntries(userId);
    }
  }

  async function deleteEntry(id) {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not signed in.");

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    // Remove locally immediately
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  /* ---------------------------
     UI
  ---------------------------- */
  if (bootLoading) {
    // Keep it quiet; your CSS already makes this look fine
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <nav className="nav">
          <NavLink to="/" className="nav-brand">
            <div className="brand-logo">R</div>
            <div className="brand-name">REFLEKT</div>
          </NavLink>
        </nav>
      </header>

      {/* Tabs */}
      {!hideTabs && (
        <div className="top-tabs">
          <div className="tabs-wrap">
            <div className="tabs">
              <NavLink to="/" className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}>
                <span className="tab-label">Home</span>
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `tab ${isActive ? "is-active" : ""}`}
              >
                <span className="tab-label">Dashboard</span>
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                session={session}
                entries={entries}
                entriesLoading={entriesLoading}
                onAddEntry={addEntry}
                onUpdateEntry={updateEntry}
                onDeleteEntry={deleteEntry}
              />
            }
          />

          <Route
            path="/auth"
            element={session ? <Navigate to="/dashboard" replace /> : <Auth />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session}>
                <Dashboard
                  session={session}
                  entries={entries}
                  entriesLoading={entriesLoading}
                  onUpdateEntry={updateEntry}
                  onDeleteEntry={deleteEntry}
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">Reflekt • private journaling</footer>
    </div>
  );
}