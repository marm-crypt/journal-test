import React, { useState } from "react";

const moods = ["Great", "Good", "Okay", "Bad", "Awful"];

export default function Home({ entries, onAddEntry }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please write something about your day.");
      return;
    }
    if (!mood) {
      setError("Please select a mood.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      onAddEntry({ text, mood });
      setText("");
      setMood("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <section className="section">
        <h1>Welcome</h1>
        <p className="muted">Write a quick entry and tag your mood.</p>
      </section>

      <section className="section">
        <h2>New entry</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <label className="label">How are you feeling?</label>
          <div className="mood-select">
            {moods.map((m) => (
              <label key={m} className={`chip ${mood === m ? "chip-selected" : ""}`}>
                <input
                  type="radio"
                  name="mood"
                  value={m}
                  checked={mood === m}
                  onChange={(e) => setMood(e.target.value)}
                />
                {m}
              </label>
            ))}
          </div>

          <label className="label mt">Write about your day</label>
          <textarea
            className="textarea"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened today? What did you notice?"
          />

          {error && <div className="error">{error}</div>}

          <div className="actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save entry"}
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2>Recent entries</h2>
        {entries.length === 0 ? (
          <p className="muted">No entries yet. Your latest will appear here.</p>
        ) : (
          <ul className="entry-list">
            {entries.slice(0, 5).map((e) => (
              <li key={e.id} className="entry-item">
                <div className="entry-header">
                  <span className={`badge badge-${e.mood.toLowerCase()}`}>{e.mood}</span>
                  <span className="date">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <p className="entry-text">{e.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
