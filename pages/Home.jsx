// pages/Home.jsx
import React, { useMemo, useState } from "react";
import EntryCard from "../components/EntryCard";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline"; // ✅ added

const PROMPTS = [
  "What’s something you’ve been carrying lately that you haven’t said out loud?",
  "What moment today made you feel most like yourself?",
  "What do you need more of right now: rest, clarity, connection, or courage?",
  "Write about something you’re proud of, even if it feels small.",
  "What’s been draining you — and what’s been refueling you?",
  "If your day had a headline, what would it be?",
];

function pickPrompt(exclude) {
  if (PROMPTS.length === 0) return "";
  if (PROMPTS.length === 1) return PROMPTS[0];
  let next = exclude;
  while (next === exclude) next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  return next;
}

// Robust sort key: created_at -> updated_at -> 0
function timeKey(entry) {
  const a = entry?.created_at ? Date.parse(entry.created_at) : NaN;
  if (!Number.isNaN(a)) return a;

  const b = entry?.updated_at ? Date.parse(entry.updated_at) : NaN;
  if (!Number.isNaN(b)) return b;

  return 0;
}

export default function Home({
  entries = [],
  entriesLoading,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) {
  // Composer open by default (as you locked)
  const [composerOpen, setComposerOpen] = useState(true);

  // Prompt state
  const [prompt, setPrompt] = useState(() => pickPrompt(""));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // First-time helper only for the user's first entry
  const showFirstTimeHelper = useMemo(() => {
    const flag = localStorage.getItem("reflekt_first_entry_done");
    return !flag && (entries?.length || 0) === 0;
  }, [entries]);

  function shufflePrompt() {
    setPrompt((p) => pickPrompt(p));
  }

  function startNewEntry() {
    setComposerOpen(true);
    setTitle("");
    setContent("");
    setPrompt((p) => pickPrompt(p));
    setMsg("");
  }

  async function save(e) {
    e.preventDefault();
    setMsg("");

    if (!content.trim()) {
      setMsg("Please write something first.");
      return;
    }

    if (typeof onAddEntry !== "function") {
      setMsg("Save is not connected (onAddEntry missing).");
      return;
    }

    setSaving(true);
    try {
      const cleanTitle = (title || "").trim() || "untitled";
      const cleanContent = content.trim();

      // Mood handled by onAddEntry (App/Supabase layer). Keep themes empty.
      await onAddEntry({
        title: cleanTitle,
        content: cleanContent,
        themes: [],
      });

      localStorage.setItem("reflekt_first_entry_done", "1");
      setComposerOpen(false);
      setMsg("");
    } catch (err) {
      setMsg(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const latest3 = useMemo(() => {
    const arr = Array.isArray(entries) ? [...entries] : [];
    arr.sort((a, b) => timeKey(b) - timeKey(a));
    return arr.slice(0, 3);
  }, [entries]);

  return (
    <div className="stack">
      {/* Composer card */}
      <div className="card">
        <div className="card-inner">
          {composerOpen ? (
            <>
              <div className="prompt-band">
                <div className="prompt-text">{prompt}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={shufflePrompt}
                    title="Shuffle"
                  >
                    {/* ✅ added icon only */}
                    <ArrowsRightLeftIcon
                      width={18}
                      height={18}
                      strokeWidth={2.2}
                      style={{ color: "currentColor" }}
                    />
                    Shuffle
                  </button>
                </div>
              </div>

              {showFirstTimeHelper && (
                <div className="small-muted">
                  Tip: After you save, Reflekt adds a gentle mood read to help you reflect later.
                </div>
              )}

              <form onSubmit={save} className="stack" style={{ gap: 12 }}>
                <label className="small-muted" style={{ fontWeight: 600 }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                />

                <label
                  className="small-muted"
                  style={{ fontWeight: 600, marginTop: 6 }}
                >
                  Entry
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What’s on your mind?"
                  rows={10}
                />

                {/* Contract: NO tags shown while typing */}

                <button
                  className={`save-btn ${content.trim().length ? "is-active" : ""}`}
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save entry"}
                </button>

                {msg && <div className="small-muted">{msg}</div>}
              </form>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-soft btn-block" onClick={startNewEntry}>
                New entry
              </button>
              <div className="small-muted">
                Start a fresh entry — a new prompt will be generated.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Latest entries */}
      <div className="card">
        <div className="card-inner">
          <div className="section-title">
            <span className="accent-dot" />
            Latest entries
          </div>

          {entriesLoading ? (
            <div className="small-muted">Loading…</div>
          ) : latest3.length === 0 ? (
            <div className="small-muted">No entries yet.</div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {latest3.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  onUpdate={onUpdateEntry}
                  onDelete={onDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}