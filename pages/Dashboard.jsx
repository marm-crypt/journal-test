// pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EntryCard from "../components/EntryCard";

/* ---------------------------
   Helpers
---------------------------- */
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

function toDayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, delta) {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

function parseDayKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function safeTime(entry) {
  const t = Date.parse(entry?.created_at || entry?.updated_at || "");
  return Number.isNaN(t) ? 0 : t;
}

/* ---------------------------
   Weekly reflection (last 7 days)
---------------------------- */
function calcWeekly(entriesNewestFirst) {
  const now = new Date();
  const cutoff = addDays(now, -7);

  const last7 = entriesNewestFirst.filter((e) => {
    const dt = new Date(e.created_at || e.updated_at || "");
    return !isNaN(dt) && dt >= cutoff;
  });

  const moodCount = new Map();
  for (const e of last7) {
    const m = e.mood || "Okay";
    moodCount.set(m, (moodCount.get(m) || 0) + 1);
  }

  const mostMood = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Okay";
  return { count: last7.length, mostMood };
}

/* ---------------------------
   Mood overview: streak cards
---------------------------- */
function calcMoodStats(entriesNewestFirst) {
  // Most common mood across all entries
  const moodCount = new Map();
  for (const e of entriesNewestFirst) {
    const m = e.mood || "Okay";
    moodCount.set(m, (moodCount.get(m) || 0) + 1);
  }
  const mostCommon = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Okay";

  // Daily mood map: for each day, use the newest entry mood
  const dayMood = new Map(); // dayKey -> mood
  for (const e of entriesNewestFirst) {
    const dt = new Date(e.created_at || e.updated_at || "");
    if (isNaN(dt)) continue;
    const k = toDayKey(dt);
    if (!dayMood.has(k)) dayMood.set(k, e.mood || "Okay"); // first is newest
  }

  // Current streak: requires entry today and consecutive previous days with same mood
  const todayKey = toDayKey(new Date());
  const todayMood = dayMood.get(todayKey);
  let currentStreak = 0;
  let currentMood = "—";

  if (todayMood) {
    currentMood = todayMood;
    currentStreak = 1;
    for (let i = 1; i < 365; i++) {
      const prevKey = toDayKey(addDays(new Date(), -i));
      const m = dayMood.get(prevKey);
      if (m === todayMood) currentStreak += 1;
      else break;
    }
  }

  // Best streak: longest run of consecutive days with same mood
  const keys = [...dayMood.keys()].sort(); // ascending date keys
  let bestStreak = 0;
  let bestMood = "—";

  let runLen = 0;
  let runMood = null;

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const mood = dayMood.get(k);
    const date = parseDayKey(k);

    if (i === 0) {
      runLen = 1;
      runMood = mood;
      continue;
    }

    const prevDate = parseDayKey(keys[i - 1]);
    const isNextDay = toDayKey(addDays(prevDate, 1)) === toDayKey(date);

    if (isNextDay && mood === runMood) {
      runLen += 1;
    } else {
      if (runLen > bestStreak) {
        bestStreak = runLen;
        bestMood = runMood || "—";
      }
      runLen = 1;
      runMood = mood;
    }
  }

  if (runLen > bestStreak) {
    bestStreak = runLen;
    bestMood = runMood || "—";
  }

  return {
    mostCommon,
    currentStreak,
    currentMood,
    bestStreak,
    bestMood,
  };
}

/* ---------------------------
   Dashboard
---------------------------- */
export default function Dashboard({
  entries = [],
  entriesLoading,
  onUpdateEntry,
  onDeleteEntry,
}) {
  // Sort newest-first once (everything else depends on this)
  const sorted = useMemo(() => {
    const arr = Array.isArray(entries) ? [...entries] : [];
    arr.sort((a, b) => safeTime(b) - safeTime(a));
    return arr;
  }, [entries]);

  const weekly = useMemo(() => calcWeekly(sorted), [sorted]);
  const moodStats = useMemo(() => calcMoodStats(sorted), [sorted]);

  const monthGroups = useMemo(() => {
    const map = new Map();
    for (const e of sorted) {
      const stamp = e.created_at || e.updated_at || new Date().toISOString();
      const key = monthKeyFromISO(stamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    const keys = [...map.keys()].sort().reverse();
    return { map, keys };
  }, [sorted]);

  const currentMonthKey = monthKeyFromISO(new Date().toISOString());
  const initialCursor =
    monthGroups.keys.includes(currentMonthKey)
      ? currentMonthKey
      : monthGroups.keys[0] || currentMonthKey;

  const [cursorMonth, setCursorMonth] = useState(initialCursor);
  const [openMonths, setOpenMonths] = useState(() => new Set([initialCursor]));

  // Keep cursor valid when entries change
  useEffect(() => {
    if (!monthGroups.keys.length) return;
    if (!monthGroups.keys.includes(cursorMonth)) {
      const next = monthGroups.keys[0];
      setCursorMonth(next);
      setOpenMonths(new Set([next]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthGroups.keys.join("|")]);

  // Auto-open current month (user can still collapse it manually)
  useEffect(() => {
    if (monthGroups.keys.includes(currentMonthKey)) {
      setOpenMonths((prev) => new Set(prev).add(currentMonthKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonthKey]);

  function toggleMonth(key) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function goPrevMonth() {
    const idx = monthGroups.keys.indexOf(cursorMonth);
    const nextKey = monthGroups.keys[idx + 1];
    if (!nextKey) return;
    setCursorMonth(nextKey);
    setOpenMonths((prev) => new Set(prev).add(nextKey));
  }

  function goNextMonth() {
    const idx = monthGroups.keys.indexOf(cursorMonth);
    const nextKey = monthGroups.keys[idx - 1];
    if (!nextKey) return;
    setCursorMonth(nextKey);
    setOpenMonths((prev) => new Set(prev).add(nextKey));
  }

  return (
    <div className="stack">
      {/* New entry CTA */}
      <div className="card">
        <div className="card-inner">
          <div className="section-title">
            <span className="accent-dot" />
            New entry
          </div>
          <Link to="/" className="btn btn-soft btn-block">
            Write a new entry
          </Link>
        </div>
      </div>

      {/* Weekly reflection (purple brand card) */}
      <div className="card card--brand">
        <div className="card-inner">
          <div style={{ fontSize: 18, fontWeight: 850 }}>Weekly reflection</div>
          <div className="small-muted">
            {weekly.count === 0 ? (
              "No entries in the last 7 days — whenever you’re ready, your reflections will show up here."
            ) : (
              <>
                You wrote <strong>{weekly.count}</strong> time{weekly.count === 1 ? "" : "s"} this week.
                Your most common mood was <strong>{weekly.mostMood}</strong>.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mood overview */}
      <div className="card">
        <div className="card-inner">
          <div className="section-title">
            <span className="accent-dot" />
            Mood overview
          </div>

          <div className="overview-grid">
            <div className="streak-card">
              <div className="streak-k">Current streak</div>
              <div className="streak-v">
                {moodStats.currentStreak
                  ? `${moodStats.currentStreak} day${moodStats.currentStreak === 1 ? "" : "s"}`
                  : "—"}
              </div>
              <div className="streak-sub">
                {moodStats.currentStreak
                  ? `Mood: ${moodStats.currentMood}`
                  : "Add an entry today to start a streak."}
              </div>
            </div>

            <div className="streak-card">
              <div className="streak-k">Most common mood</div>
              <div className="streak-v">{moodStats.mostCommon}</div>
              <div className="streak-sub">Across all entries</div>
            </div>

            <div className="streak-card">
              <div className="streak-k">Best streak</div>
              <div className="streak-v">
                {moodStats.bestStreak
                  ? `${moodStats.bestStreak} day${moodStats.bestStreak === 1 ? "" : "s"}`
                  : "—"}
              </div>
              <div className="streak-sub">
                {moodStats.bestStreak ? `Mood: ${moodStats.bestMood}` : "Build a few days in a row."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly entries */}
      <div className="card">
        <div className="card-inner">
          <div className="month-header">
            <div className="section-title" style={{ margin: 0 }}>
              <span className="accent-dot" />
              Monthly entries
            </div>

            <div className="month-nav">
              <button
                type="button"
                className="btn btn-soft"
                onClick={goPrevMonth}
                disabled={monthGroups.keys.indexOf(cursorMonth) === monthGroups.keys.length - 1}
                title="Previous month"
                aria-label="Previous month"
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={goNextMonth}
                disabled={monthGroups.keys.indexOf(cursorMonth) <= 0}
                title="Next month"
                aria-label="Next month"
              >
                →
              </button>
            </div>
          </div>

          {entriesLoading ? (
            <div className="small-muted">Loading…</div>
          ) : monthGroups.keys.length === 0 ? (
            <div className="small-muted">No entries yet.</div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {monthGroups.keys.map((key) => {
                const isOpen = openMonths.has(key);
                const list = monthGroups.map.get(key) || [];
                const isCursor = key === cursorMonth;

                return (
                  <div key={key} className="stack" style={{ gap: 10 }}>
                    <button
                      type="button"
                      className="month-toggle"
                      onClick={() => {
                        setCursorMonth(key);
                        toggleMonth(key);
                      }}
                      aria-expanded={isOpen}
                      style={{
                        borderColor: isCursor ? "rgba(116, 94, 246, 0.22)" : undefined,
                      }}
                    >
                      <div style={{ fontWeight: 750 }}>{monthLabel(key)}</div>
                      <div className="chev">{isOpen ? "▾" : "▸"}</div>
                    </button>

                    {isOpen && (
                      <div className="stack" style={{ gap: 12 }}>
                        {list.map((e) => (
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}