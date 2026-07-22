import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Plus, RotateCw } from 'lucide-react';
import { useTetris } from '../hooks/useTetris';
import Sidebar from './Sidebar';
import {
  COLS,
  ROWS,
  MEETING_DATA,
  DAY_SHORT_NAMES,
  getColumnDate,
  getRowHourLabel,
} from '../game/constants';

const CELL_SIZE = 32;
const GUTTER_WIDTH = 56;

const monthName = (date) => date.toLocaleDateString('en-US', { month: 'long' });

const GameView = () => {
  const { grid, activePiece, status, score } = useTetris();

  const startDate = getColumnDate(0);
  const endDate = getColumnDate(COLS - 1);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const dateRangeLabel = sameMonth
    ? `${monthName(startDate)} ${startDate.getDate()}\u2013${endDate.getDate()}, ${startDate.getFullYear()}`
    : `${monthName(startDate)} ${startDate.getDate()} \u2013 ${monthName(endDate)} ${endDate.getDate()}, ${startDate.getFullYear()}`;

  const activeCols = Array.from(
    { length: activePiece.shape[0].length },
    (_, i) => activePiece.pos.x + i
  ).filter((c) => c >= 0 && c < COLS);
  const currentDayCol = activeCols.length
    ? activeCols[Math.floor(activeCols.length / 2)]
    : 0;

  const timeIndicatorRow = Math.min(
    activePiece.pos.y + activePiece.shape.length - 1,
    ROWS - 1
  );

  const isCellPartOfActive = (x, y) => (
    x >= activePiece.pos.x && x < activePiece.pos.x + activePiece.shape[0].length &&
    y >= activePiece.pos.y && y < activePiece.pos.y + activePiece.shape.length &&
    !!activePiece.shape[y - activePiece.pos.y][x - activePiece.pos.x]
  );

  const RenderCell = ({ x, y }) => {
    const isActive = isCellPartOfActive(x, y);
    const type = isActive ? activePiece.type : grid[y][x];
    const data = MEETING_DATA[type] || null;

    if (!data) {
      return (
        <div
          className="border-b border-r border-gray-100 bg-white"
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      );
    }

    if (isActive) {
      return (
        <div
          className={`relative flex items-center justify-center rounded-[3px] shadow-sm ${data.solidBg} m-[1px]`}
          style={{ width: CELL_SIZE - 2, height: CELL_SIZE - 2 }}
        >
          <span className="px-0.5 text-center text-[6.5px] font-semibold leading-tight text-white truncate">
            {data.label}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`relative flex items-center justify-center rounded-[3px] border ${data.border} border-l-[3px] bg-white shadow-sm m-[1px]`}
        style={{ width: CELL_SIZE - 2, height: CELL_SIZE - 2 }}
      >
        <span className={`px-0.5 text-center text-[6.5px] font-medium leading-tight ${data.text} truncate`}>
          {data.label}
        </span>
        <RotateCw className="absolute right-[1px] top-[1px] h-[6px] w-[6px] text-gray-400" />
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-gray-50 font-sans">
      <Sidebar highlightedDate={getColumnDate(currentDayCol)} score={score} />
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-1 border-b bg-white px-1.5 py-0.5">
        <button className="flex items-center gap-0.5 rounded border border-gray-300 px-1 py-px text-[10px] text-gray-700 hover:bg-gray-50">
          <Calendar className="h-2.5 w-2.5" />
          Today
        </button>
        <div className="flex items-center text-gray-500">
          <button className="rounded p-px hover:bg-gray-100">
            <ChevronLeft className="h-2.5 w-2.5" />
          </button>
          <button className="rounded p-px hover:bg-gray-100">
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <h1 className="text-[10px] font-semibold text-gray-800">{dateRangeLabel}</h1>
          <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
        </div>
      </div>

      {/* Day header row */}
      <div className="flex border-b bg-white">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)` }}
        >
          {Array.from({ length: COLS }).map((_, x) => {
            const date = getColumnDate(x);
            const isCurrent = x === currentDayCol;
            return (
              <div
                key={x}
                className={`relative flex flex-col items-center justify-center py-1.5 ${isCurrent ? 'border-b-2 border-blue-600' : ''}`}
              >
                <span className={`text-sm font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
                <span className={`text-[9px] ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                  {DAY_SHORT_NAMES[date.getDay()]}
                </span>
                {isCurrent && (
                  <button className="absolute -top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex flex-1 overflow-auto bg-white">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0">
          {Array.from({ length: ROWS }).map((_, y) => (
            <div
              key={y}
              className="flex items-start justify-end pr-1.5 text-[9px] text-gray-400"
              style={{ height: CELL_SIZE }}
            >
              {y % 2 === 0 ? getRowHourLabel(y) : ''}
            </div>
          ))}
        </div>
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
            gridAutoRows: CELL_SIZE,
          }}
        >
          {grid.map((row, y) => row.map((_, x) => (
            <RenderCell key={`${x}-${y}`} x={x} y={y} />
          )))}
          {status === 'playing' && (
            <div
              className="pointer-events-none absolute left-0 right-0 flex items-center"
              style={{ top: timeIndicatorRow * CELL_SIZE }}
            >
              <div className="h-2 w-2 shrink-0 -translate-x-1 rounded-full bg-blue-600" />
              <div className="h-px w-full bg-blue-600" />
            </div>
          )}
          {status === 'gameover' && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <span className="rounded bg-gray-800 px-3 py-1 text-xs font-semibold text-white shadow">
                Calendar Overbooked — Clearing…
              </span>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default GameView;
