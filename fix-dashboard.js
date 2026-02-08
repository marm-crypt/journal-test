const fs = require('fs');

let content = fs.readFileSync('./pages/Dashboard.jsx', 'utf8');

// Find the start of calcMoodReflection
const startMarker = '/* ---------------------------\n   New: meaningful mood reflection';
const endMarker = '/* ---------------------------\n   Dashboard';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const newHelpers = `/* ---------------------------
   Week grid & mood trend for Weekly reflection
---------------------------- */
function calcWeekGrid(entries) {
  const dayMap = new Map();
  for (const e of entries) {
    const dt = new Date(e.created_at || e.updated_at || "");
    if (isNaN(dt)) continue;
    const k = toDayKey(dt);
    if (!dayMap.has(k)) dayMap.set(k, true);
  }

  const grid = [];
  for (let i = 6; i >= 0; i--) {
    const key = toDayKey(addDays(new Date(), -i));
    grid.push(dayMap.has(key));
  }
  return grid;
}

function calcMoodTrend(entries) {
  const last7 = entries.filter((e) => withinDays(e, 7));
  const prev7 = entries.filter((e) => {
    const dt = new Date(e.created_at || e.updated_at || "");
    if (isNaN(dt)) return false;
    const cutoff = addDays(new Date(), -14);
    const prev = addDays(new Date(), -7);
    return dt >= cutoff && dt < prev;
  });

  if (last7.length === 0 || prev7.length === 0) return null;

  const last7Moods = new Map();
  for (const e of last7) {
    const m = moodLabel(e.mood);
    last7Moods.set(m, (last7Moods.get(m) || 0) + 1);
  }

  const prev7Moods = new Map();
  for (const e of prev7) {
    const m = moodLabel(e.mood);
    prev7Moods.set(m, (prev7Moods.get(m) || 0) + 1);
  }

  const moodOrder = { Great: 5, Good: 4, Okay: 3, Bad: 2, Awful: 1 };

  const last7Avg = [...last7Moods.entries()].reduce((sum, [mood, count]) => sum + (moodOrder[mood] || 3) * count, 0) / last7.length;
  const prev7Avg = [...prev7Moods.entries()].reduce((sum, [mood, count]) => sum + (moodOrder[mood] || 3) * count, 0) / prev7.length;

  if (last7Avg > prev7Avg) return "up";
  if (last7Avg < prev7Avg) return "down";
  return null;
}

`;

  const newContent = content.slice(0, startIdx) + newHelpers + content.slice(endIdx);
  fs.writeFileSync('./pages/Dashboard.jsx', newContent);
  console.log('✓ Dashboard cleaned up successfully');
} else {
  console.log('Could not find markers');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
}
