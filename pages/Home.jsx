// pages/Home.jsx
import React, { useMemo, useState } from "react";

/* ---------- prompts ---------- */
const PROMPTS = [
  "What’s something small you handled better than before?",
  "What stayed with you from today?",
  "What felt heavier than expected today?",
  "What gave you a bit of energy today?",
  "What are you learning about yourself lately?",
  "What did you avoid today — and why?",
  "What moment made you feel most like yourself today?",
  "What drained you today, and what refilled you even a little?",
  "What’s one thought you keep looping on?",
  "What do you wish you said (or didn’t say) today?",
  "What are you proud of — even if it’s tiny?",
  "If today had a headline, what would it be?",
  "What did you do today that future-you will thank you for?",
  "What boundary did you hold (or wish you held)?",
  "What felt unexpectedly good today?",
  "What’s one fear that showed up today?",
  "What’s one thing you can let go of tonight?",
  "What’s a lesson you’re resisting?",
  "What do you need more of this week?",
  "What do you need less of this week?",
];

function randomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

/* ---------- tiny offline AI ---------- */
const MOODS = ["Great", "Good", "Okay", "Bad", "Awful"];

function analyzeText(text) {
  const t = (text || "").toLowerCase();
  const pos = [
    "good",
    "great",
    "proud",
    "happy",
    "calm",
    "relieved",
    "excited",
    "grateful",
    "love",
    "progress",
    "win",
  ];
  const neg = [
    "bad",
    "awful",
    "sad",
    "angry",
    "anxious",
    "stress",
    "stressed",
    "tired",
    "lonely",
    "worried",
    "hate",
    "panic",
    "overwhelmed",
  ];

  let score = 0;
  for (const w of pos) if (t.includes(w)) score += 1;
  for (const w of neg) if (t.includes(w)) score -= 1;

  const sentimentScore = Math.max(-1, Math.min(1, score / 6));

  let suggestedMood = "Okay";
  if (sentimentScore >= 0.6) suggestedMood = "Great";
  else if (sentimentScore >= 0.25) suggestedMood = "Good";
  else if (sentimentScore <= -0.6) suggestedMood = "Awful";
  else if (sentimentScore <= -0.25) suggestedMood = "Bad";

  const words = t
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const stop = new Set([
    "i",
    "me",
    "my",
    "mine",
    "you",
    "your",
    "yours",
    "we",
    "our",
    "ours",
    "they",
    "them",
    "their",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "so",
    "to",
    "of",
    "in",
    "on",
    "at",
    "for",
    "with",
    "as",
    "is",
    "am",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "it",
    "this",
    "that",
    "these",
    "those",
    "today",
    "yesterday",
    "tomorrow",
    "just",
    "really",
    "very",
    "like",
    "not",
    "dont",
    "didnt",
  ]);

  const freq = new Map();
  for (const w of words) {
    if (w.length < 4) continue;
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  const themes = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  const finalThemes = themes.length ? themes : text.trim().length ? ["reflection"] : [];
  if (!MOODS.includes(suggestedMood)) suggestedMood = "Okay";

  return { sentimentScore, suggestedMood, themes: finalThemes };
}

/* ---------- helpers ---------- */
function moodTagClass(mood) {
  const m = (mood || "").toLowerCase();
  if (m === "great" || m === "good") return "tag tag-mood-good";
  if (m === "okay") return "tag tag-mood-ok";
  if (m === "bad" || m === "awful") return "tag tag-mood-bad";
  return "tag tag-mood-ok";
}

function formatWhen(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- icons ---------- */
function ShuffleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 7h5l7 10h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 21h5v-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 17h5l2-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 10l3-3h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 6.5 17.5 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 6.5 17.5 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- component ---------- */
export default function Home({ entries = [], onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [prompt, setPrompt] = useState(randomPrompt());
  const [entryTitle, setEntryTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // composer starts expanded; collapses after save
  const [isCollapsed, setIsCollapsed] = useState(false);

  // first-time helper should appear once, ever (not every time entries is empty during dev)
  const [hasShownFirstTip, setHasShownFirstTip] = useState(false);

  const canSave = useMemo(() => !!text.trim() && !saving, [text, saving]);

  const isFirstEverEntry = entries.length === 0 && !hasShownFirstTip;
  const recent = entries.slice(0, 3);

  function shuffle() {
    setPrompt(randomPrompt());
  }

  function onSave(e) {
    e.preventDefault();
    if (!text.trim() || saving) return;

    setSaving(true);
    const analysis = analyzeText(text);

    onAddEntry?.({
      title: entryTitle.trim() || "untitled",
      text: text.trim(),
      sentimentScore: analysis.sentimentScore,
      suggestedMood: analysis.suggestedMood,
      themes: analysis.themes,
    });

    // after first save, we never show the helper again
    if (entries.length === 0) setHasShownFirstTip(true);

    setEntryTitle("");
    setText("");
    setSaving(false);
    setIsCollapsed(true);
  }

  // inline edit for latest entries
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditTitle((entry.title || "untitled").trim() || "untitled");
    setEditText(entry.text || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditText("");
  }

  function saveEdit(id) {
    if (!editText.trim()) return;
    onUpdateEntry?.(id, { title: editTitle.trim() || "untitled", text: editText.trim() });
    cancelEdit();
  }

  return (
    <div className="stack">
      {/* Composer */}
      <div className="card">
        <div className="card-inner">
          {!isCollapsed ? (
            <>
              <div className="prompt-band">
                <div className="prompt-text">{prompt}</div>

                <button type="button" className="btn btn-primary btn-block" onClick={shuffle}>
                  <ShuffleIcon style={{ width: 18, height: 18 }} />
                  Shuffle prompt
                </button>
              </div>

              {/* Title under prompt */}
              <div className="title-row">
                <input
                  className="title-input"
                  value={entryTitle}
                  placeholder="Title"
                  onChange={(e) => setEntryTitle(e.target.value)}
                  aria-label="Entry title"
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Focus entry title"
                  onClick={() => {
                    const el = document.querySelector('input[aria-label="Entry title"]');
                    el?.focus?.();
                  }}
                >
                  <PencilIcon style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <textarea
                placeholder="Today I…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Entry text"
              />

              <button
                type="button"
                className={`save-btn ${canSave ? "is-active" : ""}`}
                onClick={onSave}
                disabled={!canSave}
              >
                {saving ? "Saving…" : "Save entry"}
              </button>

              {isFirstEverEntry && (
                <div className="small-muted">
                  Check your entries for a <strong>magic mood read</strong> and <strong>entry theme</strong>.
                </div>
              )}
            </>
          ) : (
            // After save: ONLY New entry (pale purple)
            <button
              type="button"
              className="btn btn-soft btn-block"
              onClick={() => {
                setIsCollapsed(false);
                shuffle();
              }}
            >
              New entry
            </button>
          )}
        </div>
      </div>

      {/* Latest entries (card under composer) */}
      {recent.length > 0 && (
        <div className="card">
          <div className="card-inner">
            <div className="muted">Latest entries</div>

            <div className="stack" style={{ gap: 10 }}>
              {recent.map((e) => {
                const iso = e.createdAt || e.dateISO || e.date;
                const mood = e?.ai?.suggestedMood || "Okay";
                const themes = e?.ai?.themes || [];

                const isEditing = editingId === e.id;

                return (
                  <div key={e.id} className="entry-card">
                    <div className="entry-main">
                      <h4 className="entry-title">{(e.title || "untitled").trim() || "untitled"}</h4>
                      <div className="entry-meta">{formatWhen(iso)}</div>

                      <div className="entry-preview one-line">{(e.text || "").trim()}</div>

                      <div className="tags">
                        <span className={moodTagClass(mood)}>Mood: {mood}</span>
                        {themes.slice(0, 3).map((t) => (
                          <span key={t} className="tag tag-theme">
                            {t}
                          </span>
                        ))}
                      </div>

                      {isEditing && (
                        <div className="stack" style={{ gap: 10, marginTop: 12 }}>
                          <input
                            value={editTitle}
                            onChange={(ev) => setEditTitle(ev.target.value)}
                            placeholder="Title"
                            aria-label="Edit title"
                          />
                          <textarea
                            value={editText}
                            onChange={(ev) => setEditText(ev.target.value)}
                            aria-label="Edit text"
                          />
                          <div className="row" style={{ gap: 10 }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => saveEdit(e.id)}
                              disabled={!editText.trim()}
                            >
                              Save
                            </button>
                            <button type="button" className="btn btn-soft" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="entry-actions">
                      <button
                        type="button"
                        className="action-ic"
                        aria-label="Edit entry"
                        onClick={() => (isEditing ? cancelEdit() : startEdit(e))}
                      >
                        <EditIcon style={{ width: 18, height: 18 }} />
                      </button>

                      <button
                        type="button"
                        className="action-ic"
                        aria-label="Delete entry"
                        onClick={() => {
                          const ok = window.confirm("Delete this entry? This can’t be undone.");
                          if (ok) onDeleteEntry?.(e.id);
                        }}
                      >
                        <TrashIcon style={{ width: 18, height: 18 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="small-muted" style={{ marginTop: 6 }}>
              Tip: editing updates the same entry (no duplicates).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}