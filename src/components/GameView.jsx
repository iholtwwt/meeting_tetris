import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Plus, RotateCw, ArrowLeft, ArrowRight, ArrowDown, RotateCcw } from 'lucide-react';
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

const MAX_CELL_SIZE = 32;
const MIN_CELL_SIZE = 18;

// Computes a cell size (and matching gutter width) that keeps the whole
// board visible on narrow/mobile viewports instead of overflowing, both
// horizontally (10 columns) and vertically (20 rows plus surrounding chrome).
const useResponsiveMetrics = (chromeRefs) => {
  const [metrics, setMetrics] = useState({ cellSize: MAX_CELL_SIZE, gutterWidth: 56 });

  useEffect(() => {
    const compute = () => {
      const isMobile = window.innerWidth < 640;
      const gutterWidth = isMobile ? 36 : 56;

      const horizontalAvailable = window.innerWidth - gutterWidth - (isMobile ? 8 : 16);
      const widthCell = Math.floor(horizontalAvailable / COLS);

      let cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, widthCell));

      if (isMobile) {
        const chromeHeight = chromeRefs.reduce(
          (sum, ref) => sum + (ref.current?.offsetHeight || 0),
          0
        );
        const verticalAvailable = window.innerHeight - chromeHeight - 8;
        const heightCell = Math.floor(verticalAvailable / ROWS);
        cellSize = Math.max(MIN_CELL_SIZE, Math.min(cellSize, heightCell));
      }

      setMetrics({ cellSize, gutterWidth });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [chromeRefs]);

  return metrics;
};

const monthName = (date) => date.toLocaleDateString('en-US', { month: 'long' });

const getConnectedGroups = (gridArr) => {
  const rows = gridArr.length;
  const cols = rows ? gridArr[0].length : 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const groups = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const type = gridArr[y][x];
      if (!type || visited[y][x]) continue;

      const stack = [[x, y]];
      visited[y][x] = true;
      const cells = [];

      while (stack.length) {
        const [cx, cy] = stack.pop();
        cells.push([cx, cy]);

        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (const [nx, ny] of neighbors) {
          if (
            nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
            !visited[ny][nx] && gridArr[ny][nx] === type
          ) {
            visited[ny][nx] = true;
            stack.push([nx, ny]);
          }
        }
      }

      groups.push({ type, cells });
    }
  }

  return groups;
};

// Finds the widest contiguous row or column within a piece's cells and
// returns a pixel-space box for that run, so the title can sit in the
// widest part of the shape and rotate to follow vertical runs.
const getWidestRunBox = (cells, cellSize) => {
  const rowExtent = new Map();
  const colExtent = new Map();

  cells.forEach(([x, y]) => {
    const row = rowExtent.get(y) || { minX: x, maxX: x, count: 0 };
    row.minX = Math.min(row.minX, x);
    row.maxX = Math.max(row.maxX, x);
    row.count += 1;
    rowExtent.set(y, row);

    const col = colExtent.get(x) || { minY: y, maxY: y, count: 0 };
    col.minY = Math.min(col.minY, y);
    col.maxY = Math.max(col.maxY, y);
    col.count += 1;
    colExtent.set(x, col);
  });

  let bestRow = null;
  rowExtent.forEach((extent, y) => {
    if (!bestRow || extent.count > bestRow.count) bestRow = { ...extent, y };
  });

  let bestCol = null;
  colExtent.forEach((extent, x) => {
    if (!bestCol || extent.count > bestCol.count) bestCol = { ...extent, x };
  });

  if (bestCol && bestCol.count > bestRow.count) {
    return {
      vertical: true,
      left: bestCol.x * cellSize,
      top: bestCol.minY * cellSize,
      width: cellSize,
      height: (bestCol.maxY - bestCol.minY + 1) * cellSize,
    };
  }

  return {
    vertical: false,
    left: bestRow.minX * cellSize,
    top: bestRow.y * cellSize,
    width: (bestRow.maxX - bestRow.minX + 1) * cellSize,
    height: cellSize,
  };
};

const PieceLabel = ({ box, className }) => (
  <div
    className="pointer-events-none absolute flex items-center justify-center overflow-hidden"
    style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
  >
    <span
      className={`px-0.5 text-center leading-tight ${className}`}
      style={{
        display: 'inline-block',
        width: box.vertical ? box.height : box.width,
        transform: box.vertical ? 'rotate(-90deg)' : 'none',
      }}
    >
      {box.label}
    </span>
  </div>
);

const GameView = () => {
  const { grid, activePiece, status, score, movePiece, rotatePiece, hardDrop } = useTetris();
  const toolbarRef = useRef(null);
  const dayHeaderRef = useRef(null);
  const controlsRef = useRef(null);
  const chromeRefs = useMemo(() => [toolbarRef, dayHeaderRef, controlsRef], []);
  const { cellSize: CELL_SIZE, gutterWidth: GUTTER_WIDTH } = useResponsiveMetrics(chromeRefs);

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
          className={`rounded-[3px] shadow-sm ${data.solidBg} m-[1px]`}
          style={{ width: CELL_SIZE - 2, height: CELL_SIZE - 2 }}
        />
      );
    }

    return (
      <div
        className={`relative rounded-[3px] border ${data.border} border-l-[3px] bg-white shadow-sm m-[1px]`}
        style={{ width: CELL_SIZE - 2, height: CELL_SIZE - 2 }}
      >
        <RotateCw className="absolute right-[1px] top-[1px] h-[6px] w-[6px] text-gray-400" />
      </div>
    );
  };

  const settledGroups = getConnectedGroups(grid);
  const touchControls = [
    { label: 'Left', icon: ArrowLeft, onPress: () => movePiece(-1, 0) },
    { label: 'Rotate', icon: RotateCcw, onPress: () => rotatePiece() },
    { label: 'Right', icon: ArrowRight, onPress: () => movePiece(1, 0) },
    { label: 'Down', icon: ArrowDown, onPress: () => hardDrop() },
  ];

  const activeCellCoords = [];
  activePiece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) activeCellCoords.push([activePiece.pos.x + x, activePiece.pos.y + y]);
    });
  });

  return (
    <div className="mx-auto flex h-full w-fit bg-gray-50 font-sans">
      <Sidebar highlightedDate={getColumnDate(currentDayCol)} score={score} />
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: GUTTER_WIDTH + COLS * CELL_SIZE, maxWidth: '100%' }}
      >
      {/* Top toolbar */}
      <div ref={toolbarRef} className="flex items-center gap-1 border-b bg-white px-1.5 py-0.5">
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
          <h1 className="whitespace-nowrap text-[8px] font-semibold text-gray-800">{dateRangeLabel}</h1>
          <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white sm:hidden">
          Emails {score}
        </span>
      </div>

      {/* Day header row */}
      <div ref={dayHeaderRef} className="flex border-b bg-white">
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
          {settledGroups.map((g, i) => {
            const data = MEETING_DATA[g.type];
            if (!data) return null;
            const box = { ...getWidestRunBox(g.cells, CELL_SIZE), label: data.label };
            return <PieceLabel key={i} box={box} className={`text-[7px] font-medium ${data.text}`} />;
          })}
          {activeCellCoords.length > 0 && (
            <PieceLabel
              box={{ ...getWidestRunBox(activeCellCoords, CELL_SIZE), label: MEETING_DATA[activePiece.type]?.label }}
              className="text-[7px] font-semibold text-white"
            />
          )}
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
      <div ref={controlsRef} className="flex shrink-0 items-center justify-center gap-2 border-t bg-white p-2 sm:hidden">
        {touchControls.map(({ label, icon: Icon, onPress }) => (
          <button
            key={label}
            aria-label={label}
            onClick={onPress}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-gray-700 active:bg-gray-200"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
      </div>
    </div>
  );
};

export default GameView;
