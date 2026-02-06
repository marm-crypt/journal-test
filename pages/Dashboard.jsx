import React, { useMemo } from "react";

export default function Dashboard({ entries, stats }) {
  const last7Days = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => new Date(e.createdAt).getTime() >= sevenDaysAgo);
  }, [entries]);

  const moods = ["Great", "Good", "Okay", "Bad", "Awful"];

  return (
    <div className="page">
      <section className="section">
        <h1>Dashboard</h1>
        <p className="muted">Overview of your recent journaling.</p>
      </section>

      <section className="section grid">
        <div className="card">
          <h3>Total entries</h3>
          <p className="kpi">{stats.total}</p>
          <p className="muted">All time</p>
        </div>

        <div className="card">
          <h3>Last 7 days</h3>
          <p className="kpi">{last7Days.length}</p>
          <p className="muted">Entries this week</p>
        </div>
      </section>

      <section className="section">
        <h2>Mood breakdown</h2>
        <div className="moods">
          {moods.map((m) => (
            <div key={m} className="mood-row">
              <span className={`badge badge-${m.toLowerCase()}`}>{m}</span>
              <span className="count">{stats.moodCounts[m] || 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>All entries</h2>
        {entries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((e) => (
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
