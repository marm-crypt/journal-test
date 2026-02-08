// pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  GiftIcon,
  GlobeAltIcon,
  HeartIcon,
  HomeIcon,
  MapIcon,
  MoonIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  PuzzlePieceIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
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

function safeTime(entry) {
  const t = Date.parse(entry?.created_at || entry?.updated_at || "");
  return Number.isNaN(t) ? 0 : t;
}

function withinDays(entry, days) {
  const now = new Date();
  const cutoff = addDays(now, -days);
  const dt = new Date(entry.created_at || entry.updated_at || "");
  return !isNaN(dt) && dt >= cutoff;
}

function countWords(text) {
  return (text || "").trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function calcDailyStreak(entries) {
  const dayMood = new Map();
  for (const e of entries) {
    const dt = new Date(e.created_at || e.updated_at || "");
    if (isNaN(dt)) continue;
    const k = toDayKey(dt);
    if (!dayMood.has(k)) dayMood.set(k, true);
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = toDayKey(addDays(new Date(), -i));
    if (dayMood.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function calcAvgWordCount(entries) {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + countWords(e.content), 0);
  return Math.round(total / entries.length);
}

/* ---------------------------
   Weekly themes
---------------------------- */
const THEME_LIBRARY = [
  { id: "work", label: "Work", keywords: ["work", "job", "office", "project", "deadline"] },
  { id: "career", label: "Career", keywords: ["career", "promotion", "resume", "interview"] },
  { id: "school", label: "School", keywords: ["school", "class", "study", "homework", "exam"] },
  { id: "learning", label: "Learning", keywords: ["learn", "learning", "course", "lesson", "study"] },
  { id: "productivity", label: "Productivity", keywords: ["productive", "focus", "task", "routine"] },
  { id: "stress", label: "Stress", keywords: ["stress", "stressed", "pressure", "overwhelmed"] },
  { id: "anxiety", label: "Anxiety", keywords: ["anxious", "anxiety", "nervous", "panic", "worry"] },
  { id: "burnout", label: "Burnout", keywords: ["burnout", "burned out", "exhausted", "drained"] },
  { id: "rest", label: "Rest", keywords: ["rest", "nap", "sleep", "recharge", "pause"] },
  { id: "health", label: "Health", keywords: ["health", "doctor", "clinic", "symptom", "recovery"] },
  { id: "fitness", label: "Fitness", keywords: ["workout", "run", "gym", "exercise", "training"] },
  { id: "nutrition", label: "Nutrition", keywords: ["meal", "food", "nutrition", "diet", "cook"] },
  { id: "mental_health", label: "Mental Health", keywords: ["mental", "therapy", "counseling", "emotion"] },
  { id: "self_care", label: "Self Care", keywords: ["self care", "self-care", "self compassion", "recharge"] },
  { id: "mindfulness", label: "Mindfulness", keywords: ["mindful", "mindfulness", "meditate", "breathing"] },
  { id: "gratitude", label: "Gratitude", keywords: ["grateful", "gratitude", "thankful", "appreciate"] },
  { id: "growth", label: "Personal Growth", keywords: ["growth", "progress", "improve", "better"] },
  { id: "confidence", label: "Confidence", keywords: ["confidence", "confident", "self-esteem"] },
  { id: "motivation", label: "Motivation", keywords: ["motivation", "motivated", "drive", "inspired"] },
  { id: "purpose", label: "Purpose", keywords: ["purpose", "meaning", "direction", "goal"] },
  { id: "goals", label: "Goals", keywords: ["goal", "milestone", "target", "plan"] },
  { id: "habits", label: "Habits", keywords: ["habit", "routine", "consistency", "daily"] },
  { id: "relationships", label: "Relationships", keywords: ["relationship", "partner", "friendship"] },
  { id: "family", label: "Family", keywords: ["family", "mom", "dad", "sister", "brother"] },
  { id: "friends", label: "Friends", keywords: ["friend", "friends", "hangout", "social"] },
  { id: "love", label: "Love", keywords: ["love", "romance", "date", "boyfriend", "girlfriend"] },
  { id: "conflict", label: "Conflict", keywords: ["conflict", "argument", "fight", "tension"] },
  { id: "communication", label: "Communication", keywords: ["talk", "conversation", "communicate", "honest"] },
  { id: "boundaries", label: "Boundaries", keywords: ["boundary", "boundaries", "limits", "protect myself"] },
  { id: "money", label: "Money", keywords: ["money", "budget", "expense", "debt", "finance"] },
  { id: "planning", label: "Planning", keywords: ["plan", "planning", "schedule", "calendar"] },
  { id: "home", label: "Home", keywords: ["home", "house", "apartment", "room", "clean"] },
  { id: "chores", label: "Chores", keywords: ["chore", "laundry", "dishes", "cleaning"] },
  { id: "travel", label: "Travel", keywords: ["travel", "trip", "flight", "vacation", "journey"] },
  { id: "nature", label: "Nature", keywords: ["nature", "park", "outside", "sun", "walk"] },
  { id: "creativity", label: "Creativity", keywords: ["create", "creative", "art", "design", "paint"] },
  { id: "writing", label: "Writing", keywords: ["write", "writing", "journal", "draft"] },
  { id: "music", label: "Music", keywords: ["music", "song", "playlist", "guitar", "piano"] },
  { id: "hobbies", label: "Hobbies", keywords: ["hobby", "game", "craft", "fun"] },
  { id: "community", label: "Community", keywords: ["community", "volunteer", "neighbors", "group"] },
  { id: "faith", label: "Faith", keywords: ["faith", "spiritual", "prayer", "church"] },
  { id: "healing", label: "Healing", keywords: ["heal", "healing", "recover", "forgive"] },
  { id: "resilience", label: "Resilience", keywords: ["resilient", "resilience", "strong", "cope"] },
  { id: "change", label: "Change", keywords: ["change", "transition", "shift", "new chapter"] },
  { id: "uncertainty", label: "Uncertainty", keywords: ["uncertain", "unknown", "confused", "doubt"] },
  { id: "celebration", label: "Celebration", keywords: ["celebrate", "celebration", "party", "win"] },
  { id: "reflection", label: "Reflection", keywords: ["reflect", "reflection", "looking back"] },
  { id: "heartsore", label: "Heartbreak", keywords: ["heartbreak", "hurt", "grief", "loss"] },
  { id: "hope", label: "Hope", keywords: ["hope", "optimistic", "better tomorrow"] },
  { id: "calm", label: "Calm", keywords: ["calm", "peace", "quiet", "settled"] },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeThemeToken(value) {
  return (value || "").toString().toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeSearchText(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseThemesField(entryThemes) {
  if (Array.isArray(entryThemes)) {
    return entryThemes
      .map((theme) => {
        if (typeof theme === "string") return theme;
        if (theme && typeof theme === "object") return theme.id || theme.label || theme.name || "";
        return "";
      })
      .filter(Boolean);
  }
  if (typeof entryThemes === "string") {
    const trimmed = entryThemes.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseThemesField(parsed);
    } catch {
      // ignore json parse errors and continue with csv split
    }
    return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function hasKeywordMatch(text, keyword) {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return false;
  const keywordPattern = escapeRegExp(normalizedKeyword).replace(/\s+/g, "\\s+");
  const pattern = new RegExp(`(^|\\b)${keywordPattern}(\\b|$)`, "i");
  return pattern.test(text);
}

function calcWeeklyThemes(entries, maxThemes = 3) {
  const last7 = entries.filter((e) => withinDays(e, 7));
  const counts = new Map();

  const normalizedCatalog = THEME_LIBRARY.map((theme) => ({
    ...theme,
    labelNorm: normalizeThemeToken(theme.label),
    keywordsNorm: theme.keywords.map((k) => normalizeThemeToken(k)),
  }));

  for (const entry of last7) {
    const hitInEntry = new Set();
    const rawText = normalizeSearchText(`${entry?.title || ""} ${entry?.content || ""}`);
    const storedThemes = parseThemesField(entry?.themes);

    // 1) honor explicit stored themes when present
    for (const rawTheme of storedThemes) {
      const t = normalizeThemeToken(rawTheme);
      const matched = normalizedCatalog.find(
        (theme) => theme.id === t || theme.labelNorm === t || theme.keywordsNorm.includes(t)
      );
      if (matched) hitInEntry.add(matched.id);
    }

    // 2) infer themes from title/content keywords
    for (const theme of normalizedCatalog) {
      if (hitInEntry.has(theme.id)) continue;
      const found = theme.keywordsNorm.some((keyword) => hasKeywordMatch(rawText, keyword));
      if (found) hitInEntry.add(theme.id);
    }

    for (const themeId of hitInEntry) {
      counts.set(themeId, (counts.get(themeId) || 0) + 1);
    }
  }

  return normalizedCatalog
    .filter((theme) => counts.has(theme.id))
    .sort((a, b) => {
      const diff = (counts.get(b.id) || 0) - (counts.get(a.id) || 0);
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    })
    .slice(0, maxThemes)
    .map((theme) => ({
      id: theme.id,
      label: theme.label,
      icon: theme.icon,
      count: counts.get(theme.id) || 0,
    }));
}

function themeIconForId(themeId) {
  const iconMap = {
    work: BriefcaseIcon,
    career: BriefcaseIcon,
    school: AcademicCapIcon,
    learning: BookOpenIcon,
    productivity: CheckCircleIcon,
    stress: ExclamationTriangleIcon,
    anxiety: ExclamationTriangleIcon,
    burnout: MoonIcon,
    rest: MoonIcon,
    health: HeartIcon,
    fitness: FireIcon,
    nutrition: HeartIcon,
    mental_health: SparklesIcon,
    self_care: HeartIcon,
    mindfulness: SparklesIcon,
    gratitude: SparklesIcon,
    growth: ArrowPathIcon,
    confidence: SunIcon,
    motivation: FireIcon,
    purpose: MapIcon,
    goals: MapIcon,
    habits: ArrowPathIcon,
    relationships: UserGroupIcon,
    family: UserGroupIcon,
    friends: UserGroupIcon,
    love: HeartIcon,
    conflict: ExclamationTriangleIcon,
    communication: ChatBubbleLeftRightIcon,
    boundaries: ShieldCheckIcon,
    money: CurrencyDollarIcon,
    planning: CalendarDaysIcon,
    home: HomeIcon,
    chores: HomeIcon,
    travel: GlobeAltIcon,
    nature: SunIcon,
    creativity: PencilSquareIcon,
    writing: PencilSquareIcon,
    music: MusicalNoteIcon,
    hobbies: PuzzlePieceIcon,
    community: UserGroupIcon,
    faith: SparklesIcon,
    healing: HeartIcon,
    resilience: ShieldCheckIcon,
    change: ArrowPathIcon,
    uncertainty: CloudIcon,
    celebration: GiftIcon,
    reflection: BookOpenIcon,
    heartsore: HeartIcon,
    hope: SunIcon,
    calm: CloudIcon,
  };
  return iconMap[themeId] || SparklesIcon;
}

/* ---------------------------
   7-day activity for Weekly reflection
---------------------------- */
function calcWeekActivity(entries, weeksAgo = 0) {
  const dayMap = new Map();
  for (const e of entries) {
    const dt = new Date(e.created_at || e.updated_at || "");
    if (isNaN(dt)) continue;
    const k = toDayKey(dt);
    dayMap.set(k, (dayMap.get(k) || 0) + 1);
  }

  const anchor = addDays(new Date(), -weeksAgo * 7);
  const activity = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(anchor, -i);
    const key = toDayKey(date);
    activity.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: dayMap.get(key) || 0,
    });
  }
  return activity;
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

  const dailyStreak = useMemo(() => calcDailyStreak(sorted), [sorted]);
  const avgWordCount = useMemo(() => calcAvgWordCount(sorted), [sorted]);
  const weeklyThemes = useMemo(() => calcWeeklyThemes(sorted, 3), [sorted]);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekActivity = useMemo(() => calcWeekActivity(sorted, weekOffset), [sorted, weekOffset]);
  const weekEntryCount = useMemo(
    () => weekActivity.reduce((sum, day) => sum + day.count, 0),
    [weekActivity]
  );
  const weekRangeLabel = useMemo(() => {
    if (!weekActivity.length) return "";
    const first = weekActivity[0].dateLabel;
    const last = weekActivity[weekActivity.length - 1].dateLabel;
    return `${first} - ${last}`;
  }, [weekActivity]);

  const monthGroups = useMemo(() => {
    const map = new Map();
    for (const e of sorted) {
      const iso = e.created_at || e.updated_at || "";
      if (!iso) continue;
      const key = monthKeyFromISO(iso);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : -1));
    return { map, keys };
  }, [sorted]);

  const currentMonthKey = monthKeyFromISO(new Date().toISOString());
  const [cursorMonth, setCursorMonth] = useState(() => monthGroups.keys[0] || currentMonthKey);

  // Keep cursor valid when entries change
  useEffect(() => {
    if (!monthGroups.keys.length) return;
    if (!monthGroups.keys.includes(cursorMonth)) {
      const next = monthGroups.keys[0];
      setCursorMonth(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthGroups.keys.join("|")]);

  function goPrevMonth() {
    const idx = monthGroups.keys.indexOf(cursorMonth);
    const nextKey = monthGroups.keys[idx + 1];
    if (!nextKey) return;
    setCursorMonth(nextKey);
  }

  function goNextMonth() {
    const idx = monthGroups.keys.indexOf(cursorMonth);
    const nextKey = monthGroups.keys[idx - 1];
    if (!nextKey) return;
    setCursorMonth(nextKey);
  }

  function goPrevWeek() {
    setWeekOffset((v) => v + 1);
  }

  function goNextWeek() {
    setWeekOffset((v) => Math.max(0, v - 1));
  }

  return (
    <div className="stack">
      {/* New entry CTA */}
      <Link to="/" className="btn btn-block new-entry-btn">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <PlusIcon width={16} height={16} strokeWidth={2.4} />
          New Entry
        </span>
      </Link>

      <div className="card">
        <div className="card-inner">
          <div className="week-journal-header">
            <div className="section-title section-title--prompt" style={{ marginBottom: 0 }}>
              Your week in journalling
            </div>
            <div className="week-journal-nav">
              <button
                type="button"
                className="btn btn-soft"
                onClick={goPrevWeek}
                aria-label="Previous week"
                title="Previous week"
              >
                ←
              </button>
              <div className="week-journal-range">
                <span className="week-journal-range-main">{weekRangeLabel}</span>
                <span className="week-journal-range-meta">
                  {weekEntryCount} {weekEntryCount === 1 ? "entry" : "entries"}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-soft"
                onClick={goNextWeek}
                disabled={weekOffset === 0}
                aria-label="Next week"
                title="Next week"
              >
                →
              </button>
            </div>
          </div>
          <div className="week-journal-grid">
            {weekActivity.map((day) => (
              <div
                key={day.key}
                className={`week-journal-day ${day.count > 0 ? "is-active" : "is-rest"} ${
                  day.count >= 3 ? "level-3" : day.count === 2 ? "level-2" : day.count === 1 ? "level-1" : "level-0"
                }`}
              >
                <div className="week-journal-day-label">{day.dateLabel}</div>
                <div className="week-journal-dot" aria-label={day.label}>
                  {day.count > 0 && (
                    <svg className="week-journal-check" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 12.5l4 4L18 8.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="week-journal-day-mini">{day.label.charAt(0).toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly reflection */}
      <div className="card card--brand">
        <div className="card-inner">
          <div className="section-title section-title--prompt" style={{ color: "rgba(255,255,255,0.85)", marginBottom: 12 }}>
            Weekly reflection
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 10 }}>
              <div className="streak-card">
                <div className="streak-k">Daily streak</div>
                <div className="streak-v">{dailyStreak}</div>
                <div className="streak-sub">{dailyStreak === 1 ? "day in a row" : "days in a row"}</div>
              </div>
              <div className="streak-card">
                <div className="streak-k">Words / entry</div>
                <div className="streak-v">{avgWordCount}</div>
                <div className="streak-sub">average</div>
              </div>
            </div>

            <div className="streak-card" style={{ marginBottom: 12 }}>
              <div className="streak-k">Themes this week</div>
              {weeklyThemes.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {weeklyThemes.map((theme) => {
                    const Icon = themeIconForId(theme.id);
                    return (
                      <span key={theme.id} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Icon width={14} height={14} />
                        {theme.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="streak-v">—</div>
              )}
              <div className="streak-sub">
                {weekEntryCount > 0 ? `from ${weekEntryCount} entries` : "no entries in last 7 days"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly entries */}
      <div className="card">
        <div className="card-inner">
          <div className="month-header">
            <div className="section-title section-title--prompt" style={{ margin: 0 }}>
              Monthly entries
            </div>
          </div>

          {entriesLoading ? (
            <div className="small-muted">Loading…</div>
          ) : monthGroups.keys.length === 0 ? (
            <div className="small-muted">No entries yet.</div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 44px",
                  alignItems: "center",
                  gap: 10,
                }}
              >
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
                <div style={{ textAlign: "center", fontWeight: 750 }}>{monthLabel(cursorMonth)}</div>
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

              <div className="stack" style={{ gap: 12 }}>
                {(monthGroups.map.get(cursorMonth) || []).map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    onUpdate={onUpdateEntry}
                    onDelete={onDeleteEntry}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
