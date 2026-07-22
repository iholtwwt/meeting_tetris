import React from 'react';
import {
  Mail,
  CalendarDays,
  Grid3X3,
  Users,
  CheckSquare,
  StickyNote,
  Share2,
  Cloud,
  LayoutGrid,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

const ICON_RAIL_ITEMS = [
  { icon: Mail, active: false },
  { icon: CalendarDays, active: true },
  { icon: Grid3X3, active: false },
  { icon: Users, active: false },
  { icon: CheckSquare, active: false },
  { icon: StickyNote, active: false },
  { icon: Share2, active: false },
  { icon: Cloud, active: false },
];

const WEEK_DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

const buildMonthMatrix = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const cursor = new Date(year, month, 1 - startDay);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const Sidebar = ({ highlightedDate, score = 0 }) => {
  const year = highlightedDate.getFullYear();
  const month = highlightedDate.getMonth();
  const monthLabel = highlightedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weeks = buildMonthMatrix(year, month);

  return (
    <div className="hidden h-full shrink-0 sm:flex">
      <div className="flex w-12 flex-col items-center gap-1 border-r bg-[#f3f2f1] py-2">
        {ICON_RAIL_ITEMS.map(({ icon: Icon, active }, i) => (
          <button
            key={i}
            className={`relative flex h-9 w-9 items-center justify-center rounded ${active ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            {active && <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded bg-blue-600" />}
            <Icon className="h-[18px] w-[18px]" />
            {active && score > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold leading-none text-white">
                {score > 999 ? '999+' : score}
              </span>
            )}
          </button>
        ))}
        <div className="mt-auto">
          <button className="flex h-9 w-9 items-center justify-center rounded text-gray-500 hover:bg-gray-200">
            <LayoutGrid className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex w-56 flex-col gap-3 overflow-y-auto border-r bg-white p-3">
        <button className="flex items-center justify-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          <CalendarPlus className="h-4 w-4" />
          New event
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        <div>
          <div className="mb-1 flex items-center justify-between px-1">
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
            <div className="flex gap-1 text-gray-400">
              <ChevronUp className="h-3.5 w-3.5" />
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] text-gray-400">
            {WEEK_DAY_LETTERS.map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-[12px]">
            {weeks.flat().map((date, i) => {
              const inMonth = date.getMonth() === month;
              const isHighlighted = isSameDay(date, highlightedDate);
              return (
                <div key={i} className="flex items-center justify-center py-[3px]">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isHighlighted
                        ? 'bg-blue-600 font-semibold text-white'
                        : inMonth
                          ? 'text-gray-700'
                          : 'text-gray-300'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-2 text-sm text-blue-600">
          <button className="flex items-center gap-2 hover:underline">
            <CalendarPlus className="h-4 w-4" /> Add calendar
          </button>
          <button className="flex items-center gap-2 hover:underline">
            <Share2 className="h-4 w-4" /> Go to my booking page
          </button>
        </div>

        <div className="border-t pt-2">
          <div className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            My calendars
          </div>
          <div className="flex items-center gap-2 pl-1 text-sm text-gray-700">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
            Calendar
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
