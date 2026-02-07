// pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* ---------- helpers ---------- */
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

function monthKeyFromISO(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function moodTagClass(mood) {
  const m = (mood || "").toLowerCase();
  if (m === "great" || m === "good") return "tag tag-mood-good";
  if (m === "okay") return "tag tag-mood-ok";
  if (m === "bad" || m === "awful") return "tag tag-mood-bad";
  return "tag tag-mood-ok";
}

/* ---------- icons ---------- */
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
      <path
        d="M6 7l1 14h10l1-14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- weekly reflection ---------- */
function getWeeklyReflection(entries) {
  if (!entries.length) return "No entries yet.";

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const lastWeek = entries.filter((e) => {
    const iso = e.createdAt || e.dateISO || e.date;
    return new Date(iso).getTime() >= weekAgo;
  });

  if (!lastWeek.length) return "No entries from the past week yet.";

  const counts = { Great: 0, Good: 0, Okay: 0, Bad: 0, Awful: 0 };
  for (const e of lastWeek) {
    const m = e?.ai?.suggestedMood || "Okay";
    if (counts[m] !== undefined) counts[m] += 1;
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  if (dominant === "Great" || dominant === "Good") return "This past week leaned positive.";
  if (dominant === "Bad" || dominant === "Awful") return "This week felt heavier overall.";
  return "The week leaned neutral.";
}

/* ---------- streak cards ---------- */
function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function computeMoodStreaks(entries) {
  if (!entries.length) {
    return {
      currentStreakDays: 0,
      currentMood: "Okay",
      mostCommonMood: "Okay",
      bestStreakDays: 0,
    };
  }

  // newest -> oldest entries, one per day (newest entry of that day)
  const byDay = new Map();
  for (const e of entries) {
    const iso = e.createdAt || e.dateISO || e.date;
    const dk = dayKey(iso);
    if (!byDay.has(dk)) byDay.set(dk, e);
  }

  const days = [...byDay.keys()].sort((a, b) => (a > b ? -1 : 1));
  const dayEntries = days.map((k) => byDay.get(k));

  const moodCounts = { Great: 0, Good: 0, Okay: 0, Bad: 0, Awful: 0 };
  for (const e of entries) {
    const m = e?.ai?.suggestedMood || "Okay";
    if (moodCounts[m] !== undefined) moodCounts[m] += 1;
  }
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  const currentMood = dayEntries[0]?.ai?.suggestedMood || "Okay";
  let currentStreakDays = 0;
  for (const e of dayEntries) {
    const m = e?.ai?.suggestedMood || "Okay";
    if (m === currentMood) currentStreakDays += 1;
    else break;
  }

  let bestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < dayEntries.length; i++) {
    const prevMood = dayEntries[i - 1]?.ai?.suggestedMood || "Okay";
    const mood = dayEntries[i]?.ai?.suggestedMood || "Okay";
    if (mood === prevMood) run += 1;
    else {
      bestStreakDays = Math.max(bestStreakDays, run);
      run = 1;
    }
  }
  bestStreakDays = Math.max(bestStreakDays, run);

  return { currentStreakDays, currentMood, mostCommonMood, bestStreakDays };
}

/* ---------- Dashboard ---------- */
export default function Dashboard({ entries = [], onUpdateEntry, onDeleteEntry }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const iso = e.createdAt || e.dateISO || e.date;
      if (!iso) continue;
      const key = monthKeyFromISO(iso);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }

    const keys = [...map.keys()].sort((a, b) => (a > b ? -1 : 1));

    for (const k of keys) {
      map.get(k).sort((a, b) => {
        const aISO = a.createdAt || a.dateISO || a.date;
        const bISO = b.createdAt || b.dateISO || b.date;
        return new Date(bISO).getTime() - new Date(aISO).getTime();
      });
    }

    return { map, keys };
  }, [entries]);

  const defaultMonthKey = grouped.keys[0] || null;

  // active month (for prev/next + “Viewing” label)
  const [activeMonthKey, setActiveMonthKey] = useState(defaultMonthKey);

  useEffect(() => {
    if (!defaultMonthKey) return;
    setActiveMonthKey((prev) => prev || defaultMonthKey);
  }, [defaultMonthKey]);

  // collapsible months; expand active month automatically
  const [openMonths, setOpenMonths] = useState(() =>
    defaultMonthKey ? new Set([defaultMonthKey]) : new Set()
  );

  useEffect(() => {
    if (!activeMonthKey) return;
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.add(activeMonthKey);
      return next;
    });
  }, [activeMonthKey]);

  const activeIndex = useMemo(() => {
    if (!activeMonthKey) return -1;
    return grouped.keys.indexOf(activeMonthKey);
  }, [grouped.keys, activeMonthKey]);

  const goPrevMonth = () => {
    if (activeIndex < 0) return;
    const nextKey = grouped.keys[activeIndex + 1]; // newest -> oldest
    if (nextKey) setActiveMonthKey(nextKey);
  };

  const goNextMonth = () => {
    if (activeIndex <= 0) return;
    const nextKey = grouped.keys[activeIndex - 1];
    if (nextKey) setActiveMonthKey(nextKey);
  };

  const weeklyReflection = useMemo(() => getWeeklyReflection(entries), [entries]);
  const streaks = useMemo(() => computeMoodStreaks(entries), [entries]);

  // editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");

  function toggleMonth(k) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

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
      {/* New entry CTA */}
      <div className="card">
        <div className="card-inner">
          <Link to="/" className="btn btn-soft btn-block" style={{ textDecoration: "none" }}>
            New entry
          </Link>
        </div>
      </div>

      {/* Weekly reflection (brand card; uses your .card--brand styles) */}
      <div className="card card--brand">
        <div className="card-inner">
          <h3 className="section-title">Weekly reflection</h3>
          <div className="small-muted">{weeklyReflection}</div>
        </div>
      </div>

      {/* Mood overview (streak cards) */}
      <div className="card">
        <div className="card-inner">
          <h3 className="section-title">Mood overview</h3>

          <div className="overview-grid">
            <div className="streak-card">
              <div className="streak-k">Current streak</div>
              <div className="streak-v">{streaks.currentStreakDays ? `${streaks.currentStreakDays} day(s)` : "—"}</div>
              <div className="streak-sub">
                Mood: <strong>{streaks.currentMood}</strong>
              </div>
            </div>

            <div className="streak-card">
              <div className="streak-k">Most common mood</div>
              <div className="streak-v">{streaks.mostCommonMood}</div>
              <div className="streak-sub">Across all entries</div>
            </div>

            <div className="streak-card">
              <div className="streak-k">Best streak</div>
              <div className="streak-v">{streaks.bestStreakDays ? `${streaks.bestStreakDays} day(s)` : "—"}</div>
              <div className="streak-sub">Same mood days in a row</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly view (keep month toggles the same, change month with arrows) */}
      <div className="card">
        <div className="card-inner">
          <div className="month-header">
            <div>
              <h3 className="section-title" style={{ marginBottom: 6 }}>
                Monthly view
              </h3>
              {activeMonthKey && (
                <div className="small-muted">
                  <span className="accent-dot" />
                  Viewing: <strong>{monthLabel(activeMonthKey)}</strong>
                </div>
              )}
            </div>

            <div className="month-nav">
              <button
                type="button"
                className="btn btn-soft"
                onClick={goPrevMonth}
                disabled={activeIndex === -1 || activeIndex === grouped.keys.length - 1}
                aria-label="Previous month"
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={goNextMonth}
                disabled={activeIndex <= 0}
                aria-label="Next month"
              >
                →
              </button>
            </div>
          </div>

          {grouped.keys.length === 0 ? (
            <div className="small-muted">No entries yet — save one on Home to see it here.</div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {grouped.keys.map((k) => {
                const isOpen = openMonths.has(k);
                const list = grouped.map.get(k) || [];

                return (
                  <div key={k}>
                    <button
                      type="button"
                      className="month-toggle"
                      onClick={() => {
                        toggleMonth(k);
                        setActiveMonthKey(k); // keeping dropdown/toggles the same, but also updates “Viewing”
                      }}
                      aria-expanded={isOpen}
                    >
                      <div style={{ fontWeight: 600 }}>{monthLabel(k)}</div>
                      <div className="small-muted">{list.length} entries</div>

                      <span
                        className="chev"
                        aria-hidden="true"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      >
                        <ChevronIcon style={{ width: 18, height: 18 }} />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="stack" style={{ marginTop: 10, gap: 10 }}>
                        {list.map((e) => {
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}