'use strict';

const LEVELS = {
  easy:   { rows:  9, cols:  9, mines:  10 },
  medium: { rows: 16, cols: 16, mines:  40 },
  hard:   { rows: 16, cols: 30, mines:  99 },
  expert: { rows: 24, cols: 30, mines: 160 }
};

class Game {
  constructor(level = 'easy') {
    this.level = level;
    const { rows, cols, mines } = LEVELS[level];
    this.rows = rows;
    this.cols = cols;
    this.totalMines = mines;
    // cells[r][c] = { mine: bool, flagged: bool, revealed: bool, count: int }
    this.cells = [];
    this.flagCount = 0;
    this.revealedCount = 0;
    this.openedSinceLastSteal = 0;
    this.firstClick = true;
    this.gameOver = false;
    this.won = false;
    this.seconds = 0;
    this.timerInterval = null;
    this._initBoard();
  }

  _initBoard() {
    this.cells = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        mine: false, flagged: false, revealed: false, count: 0
      }))
    );
  }

  _placeMines(safeRow, safeCol) {
    const candidates = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (Math.abs(r - safeRow) > 1 || Math.abs(c - safeCol) > 1)
          candidates.push([r, c]);

    for (let i = 0; i < this.totalMines; i++) {
      const j = i + Math.floor(Math.random() * (candidates.length - i));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      const [r, c] = candidates[i];
      this.cells[r][c].mine = true;
    }
    this._calcCounts();
  }

  _calcCounts() {
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].mine) continue;
        let count = 0;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.cells[nr][nc].mine)
            count++;
        }
        this.cells[r][c].count = count;
      }
    }
  }

  // Returns { type: 'none'|'mine'|'reveal'|'win', steals?: number, row?: number, col?: number }
  reveal(row, col) {
    if (this.gameOver || this.won) return { type: 'none' };
    const cell = this.cells[row][col];
    if (cell.revealed || cell.flagged) return { type: 'none' };

    if (this.firstClick) {
      this.firstClick = false;
      this._placeMines(row, col);
      this._startTimer();
    }

    if (cell.mine) {
      cell.revealed = true;
      this.gameOver = true;
      this._stopTimer();
      return { type: 'mine', row, col };
    }

    const newlyRevealed = this._floodFill(row, col);
    this.revealedCount += newlyRevealed;
    this.openedSinceLastSteal += newlyRevealed;

    const steals = Math.floor(this.openedSinceLastSteal / 5);
    this.openedSinceLastSteal %= 5;

    if (this.revealedCount >= this.rows * this.cols - this.totalMines) {
      this.won = true;
      this._stopTimer();
      return { type: 'win', steals };
    }
    return { type: 'reveal', steals };
  }

  _floodFill(row, col) {
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const stack = [[row, col]];
    let count = 0;
    while (stack.length) {
      const [r, c] = stack.pop();
      const cell = this.cells[r][c];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      count++;
      if (cell.count === 0) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols)
            stack.push([nr, nc]);
        }
      }
    }
    return count;
  }

  // Returns true (flag placed), false (flag removed), or false (not allowed)
  toggleFlag(row, col) {
    if (this.gameOver || this.won || this.firstClick) return false;
    const cell = this.cells[row][col];
    if (cell.revealed) return false;
    cell.flagged = !cell.flagged;
    this.flagCount += cell.flagged ? 1 : -1;
    return cell.flagged;
  }

  // Returns [row, col] of stolen flag, or null if no flags exist
  stealRandomFlag() {
    const flagged = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.cells[r][c].flagged) flagged.push([r, c]);
    if (!flagged.length) return null;
    const [r, c] = flagged[Math.floor(Math.random() * flagged.length)];
    this.cells[r][c].flagged = false;
    this.flagCount--;
    return [r, c];
  }

  getAllMines() {
    const result = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.cells[r][c].mine) result.push([r, c]);
    return result;
  }

  _startTimer() {
    this.timerInterval = setInterval(() => {
      this.seconds++;
      const m = String(Math.floor(this.seconds / 60)).padStart(2, '0');
      const s = String(this.seconds % 60).padStart(2, '0');
      document.getElementById('time').textContent = `${m}:${s}`;
    }, 1000);
  }

  _stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }
}
