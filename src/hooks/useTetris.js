import { useState, useEffect, useCallback } from 'react';
import { COLS, ROWS, SHAPES, SHAPE_KEYS } from '../game/constants';

const createEmptyGrid = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const createRandomPiece = () => {
  const type = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
  return {
    pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
    shape: SHAPES[type],
    type,
  };
};

const isValidPosition = (pos, shape, gridArr) => {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = pos.x + col;
        const newY = pos.y + row;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
        if (newY >= 0 && gridArr[newY] && gridArr[newY][newX]) return false;
      }
    }
  }
  return true;
};

export const useTetris = () => {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [activePiece, setActivePiece] = useState(createRandomPiece());
  const [status, setStatus] = useState('playing');
  const [score, setScore] = useState(0);

  const isValidMove = useCallback((pos, shape) => isValidPosition(pos, shape, grid), [grid]);

  const spawnPiece = useCallback(() => {
    setActivePiece(createRandomPiece());
  }, []);

  const movePiece = (dx, dy) => {
    if (status !== 'playing') return false;
    const newPos = { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy };
    if (isValidMove(newPos, activePiece.shape)) {
      setActivePiece(prev => ({ ...prev, pos: newPos }));
      return true;
    }
    return false;
  };

  const hardDrop = () => {
    if (status !== 'playing') return;
    let newY = activePiece.pos.y;
    while (isValidMove({ x: activePiece.pos.x, y: newY + 1 }, activePiece.shape)) {
      newY++;
    }
    setActivePiece(prev => ({ ...prev, pos: { x: prev.pos.x, y: newY } }));
  };

  const rotatePiece = () => {
    if (status !== 'playing') return;
    const rotated = activePiece.shape[0].map((_, i) =>
      activePiece.shape.map(row => row[i]).reverse()
    );
    if (isValidMove(activePiece.pos, rotated)) {
      setActivePiece(prev => ({ ...prev, shape: rotated }));
    }
  };

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      const moved = movePiece(0, 1);
      if (!moved) {
        const newGrid = grid.map(row => [...row]);
        activePiece.shape.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              const targetY = activePiece.pos.y + y;
              const targetX = activePiece.pos.x + x;
              if (targetY >= 0 && targetY < ROWS) {
                newGrid[targetY][targetX] = activePiece.type;
              }
            }
          });
        });

        const remainingRows = newGrid.filter(row => !row.every(cell => cell !== null));
        const clearedCount = ROWS - remainingRows.length;
        const emptyRows = Array.from({ length: clearedCount }, () => Array(COLS).fill(null));
        const clearedGrid = [...emptyRows, ...remainingRows];

        if (clearedCount > 0) {
          const lineScores = [0, 100, 300, 500, 800];
          setScore(prev => prev + (lineScores[clearedCount] ?? clearedCount * 200));
        }

        const nextPiece = createRandomPiece();
        if (!isValidPosition(nextPiece.pos, nextPiece.shape, clearedGrid)) {
          setGrid(clearedGrid);
          setStatus('gameover');
          return;
        }

        setGrid(clearedGrid);
        setActivePiece(nextPiece);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [grid, activePiece, movePiece, status]);

  useEffect(() => {
    if (status !== 'gameover') return;
    let dropsRemaining = ROWS;
    const fallInterval = setInterval(() => {
      setGrid(prev => [Array(COLS).fill(null), ...prev.slice(0, ROWS - 1)]);
      dropsRemaining -= 1;
      if (dropsRemaining <= 0) {
        clearInterval(fallInterval);
        setGrid(createEmptyGrid());
        setActivePiece(createRandomPiece());
        setScore(0);
        setStatus('playing');
      }
    }, 60);
    return () => clearInterval(fallInterval);
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); break;
        case 'ArrowUp':
        case ' ': rotatePiece(); break;
        case 'z':
        case 'c': hardDrop(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, grid]);

  return { grid, activePiece, movePiece, rotatePiece, hardDrop, spawnPiece, status, score };
};
