// components/EntryCard.jsx
import React, { useState } from "react";

/* ---------------------------
   Helpers
---------------------------- */
function oneLine(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);

    const parts = d
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .split(" ");

    const weekday = parts[0]; // "Fri,"
    const month = parts[1];   // "Feb"
    const day = parts[2].replace(",", ""); // "6"
    const year = parts[3]; // "2026"

    return `${weekday} ${month} ${day}, ${year}`;
  } catch {
    return "";
  }
}

/* ---------------------------
   Mood logic (5 options)
   Great / Good / Okay / Bad / Awful
   (Used only when editing + saving)
---------------------------- */
function moodFromText(text) {
  const t = ` ${(text || "").toLowerCase()} `;
  if (t.trim().length < 10) return "Okay";

  const phraseBoost = [
    { p: " so proud ", v: 3 },
    { p: " proud of ", v: 2 },
    { p: " so grateful ", v: 3 },
    { p: " really grateful ", v: 3 },
    { p: " i feel grateful ", v: 2 },
    { p: " relieved ", v: 2 },
    { p: " so relieved ", v: 3 },
    { p: " excited ", v: 2 },
    { p: " so excited ", v: 3 },
    { p: " i can't wait ", v: 2 },
    { p: " happy ", v: 2 },
    { p: " so happy ", v: 3 },
    { p: " amazing ", v: 3 },
    { p: " awesome ", v: 3 },
    { p: " best day ", v: 4 },
    { p: " i love ", v: 2 },

    { p: " i can't do this ", v: -4 },
    { p: " can't handle ", v: -3 },
    { p: " hopeless ", v: -4 },
    { p: " panic ", v: -4 },
    { p: " having a panic ", v: -4 },
    { p: " terrified ", v: -4 },
    { p: " so anxious ", v: -3 },
    { p: " anxious ", v: -2 },
    { p: " overwhelmed ", v: -3 },
    { p: " so overwhelmed ", v: -4 },
    { p: " stressed ", v: -2 },
    { p: " so stressed ", v: -3 },
    { p: " exhausted ", v: -3 },
    { p: " burnt out ", v: -3 },
    { p: " depressed ", v: -4 },
    { p: " devastated ", v: -4 },
    { p: " miserable ", v: -4 },
    { p: " awful ", v: -4 },
    { p: " i hate ", v: -2 },
    { p: " lonely ", v: -2 },
  ];

  const negationFixes = [
    { p: " not bad ", v: 2 },
    { p: " not too bad ", v: 2 },
    { p: " not terrible ", v: 2 },
    { p: " not awful ", v: 2 },
    { p: " not sad ", v: 1 },
    { p: " not angry ", v: 1 },
    { p: " not stressed ", v: 1 },
    { p: " not anxious ", v: 1 },
    { p: " not worried ", v: 1 },
  ];

  const posWords = new Map([
    ["grateful", 2],
    ["relieved", 2],
    ["calm", 1],
    ["peaceful", 2],
    ["content", 1],
    ["good", 1],
    ["great", 2],
    ["joy", 2],
    ["joyful", 2],
    ["proud", 2],
    ["confident", 2],
    ["hopeful", 2],
    ["excited", 2],
    ["happy", 2],
    ["love", 1],
    ["amazing", 3],
    ["awesome", 3],
    ["fantastic", 3],
    ["better", 1],
    ["improving", 1],
  ]);

  const negWords = new Map([
    ["sad", -2],
    ["down", -1],
    ["anxious", -2],
    ["worried", -2],
    ["stressed", -2],
    ["overwhelmed", -3],
    ["tired", -1],
    ["exhausted", -3],
    ["burnt", -2],
    ["burnout", -3],
    ["angry", -2],
    ["mad", -1],
    ["frustrated", -2],
    ["lonely", -2],
    ["scared", -2],
    ["terrified", -4],
    ["panic", -4],
    ["awful", -4],
    ["terrible", -3],
    ["horrible", -4],
    ["miserable", -4],
    ["hopeless", -4],
  ]);

  let score = 0;

  for (const x of phraseBoost) if (t.includes(x.p)) score += x.v;
  for (const x of negationFixes) if (t.includes(x.p)) score += x.v;

  const tokens = t
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const w of tokens) {
    if (posWords.has(w)) score += posWords.get(w);
    if (negWords.has(w)) score += negWords.get(w);
  }

  const hasPos = tokens.some((w) => posWords.has(w));
  const hasNeg = tokens.some((w) => negWords.has(w));
  if (hasPos && hasNeg) score *= 0.75;

  if (score >= 6) return "Great";
  if (score >= 2) return "Good";
  if (score > -2) return "Okay";
  if (score > -6) return "Bad";
  return "Awful";
}

function moodClass(mood) {
  if (mood === "Great" || mood === "Good") return "tag-mood-good";
  if (mood === "Okay") return "tag-mood-ok";
  return "tag-mood-bad";
}

/* ---------------------------
   Icons
---------------------------- */
function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 6.5l4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------
   EntryCard
---------------------------- */
export default function EntryCard({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState(entry?.title || "untitled");
  const [c, setC] = useState(entry?.content || "");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setMsg("");
    if (!c.trim()) {
      setMsg("Entry can’t be empty.");
      return;
    }
    if (typeof onUpdate !== "function") {
      setMsg("Update is not connected.");
      return;
    }

    setSaving(true);
    try {
      const content = c.trim();
      const title = (t || "").trim() || "untitled";
      const mood = moodFromText(content);

      await onUpdate(entry.id, { title, content, mood, themes: [] });
      setEditing(false);
    } catch (e) {
      setMsg(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (typeof onDelete !== "function") return;
    if (!confirm("Delete this entry?")) return;
    await onDelete(entry.id);
  }

  const shownTime = entry?.created_at || entry?.updated_at || "";
  const mood = entry?.mood || "Okay";

  return (
    <div className="entry-card">
      <div className="entry-main">
        {!editing ? (
          <>
            <h3 className="entry-title one-line">{entry?.title || "untitled"}</h3>
            <div className="entry-meta">{shownTime ? fmtTime(shownTime) : ""}</div>
            <div className="entry-preview one-line">{oneLine(entry?.content)}</div>
            <div className="tags">
              <span className={`tag ${moodClass(mood)}`}>Mood: {mood}</span>
            </div>
          </>
        ) : (
          <div className="edit-form">
            <label className="small-muted">Title</label>
            <input value={t} onChange={(e) => setT(e.target.value)} />

            <label className="small-muted">Entry</label>
            <textarea value={c} onChange={(e) => setC(e.target.value)} rows={10} />

            <div className="edit-actions">
              <button className="btn btn-primary" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-soft" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>

            {msg && <div className="small-muted">{msg}</div>}
          </div>
        )}
      </div>

      {!editing && (
        <div className="entry-actions">
          <button className="action-ic" onClick={() => setEditing(true)}>
            <IconEdit />
          </button>
          <button className="action-ic" onClick={remove}>
            <IconTrash />
          </button>
        </div>
      )}
    </div>
  );
}