export const COLS = 10;
export const ROWS = 20;

export const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [[1, 1, 1], [0, 1, 0]],
  L: [[1, 1, 1], [0, 0, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[1, 1, 1], [0, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
};

export const COLORS = {
  I: '#3b82f6',
  J: '#1d4ed8',
  L: '#ef4444',
  O: '#eab308',
  S: '#22c55e',
  T: '#a855f7',
  Z: '#ec4899',
};

export const SHAPE_KEYS = Object.keys(SHAPES);

export const BASE_DATE = new Date(2026, 6, 20); // Mon, July 20 2026

export const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getColumnDate = (colIndex) => {
  const date = new Date(BASE_DATE);
  date.setDate(BASE_DATE.getDate() + colIndex);
  return date;
};

export const HOURS_PER_ROW = 0.5; // each row represents 30 minutes
export const START_HOUR = 9; // board starts at 9 AM

export const getRowHourLabel = (rowIndex) => {
  const totalHours = START_HOUR + rowIndex * HOURS_PER_ROW;
  const hour24 = Math.floor(totalHours) % 24;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
};

export const MEETING_DATA = {
  I: { label: "Sprint Plan", solidBg: "bg-blue-600", border: "border-blue-600", text: "text-blue-800" },
  J: { label: "Design Review", solidBg: "bg-indigo-600", border: "border-indigo-600", text: "text-indigo-800" },
  L: { label: "Dev Sync", solidBg: "bg-cyan-600", border: "border-cyan-600", text: "text-cyan-800" },
  O: { label: "Standup", solidBg: "bg-amber-500", border: "border-amber-500", text: "text-amber-800" },
  S: { label: "Stakeholder Call", solidBg: "bg-emerald-600", border: "border-emerald-600", text: "text-emerald-800" },
  T: { label: "Product Demo", solidBg: "bg-purple-600", border: "border-purple-600", text: "text-purple-800" },
  Z: { label: "1:1 Meeting", solidBg: "bg-pink-600", border: "border-pink-600", text: "text-pink-800" },
};
