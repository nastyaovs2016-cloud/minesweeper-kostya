'use strict';

const LEVELS = {
  easy:   { rows:  9, cols:  9, mines:  10 },
  medium: { rows: 16, cols: 16, mines:  40 },
  hard:   { rows: 16, cols: 30, mines:  99 },
  expert: { rows: 24, cols: 30, mines: 160 }
};

const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

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
    const dirs = DIRS;
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
    const dirs = DIRS;
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

  // Returns true (flag placed), false (flag removed), or null (not allowed)
  toggleFlag(row, col) {
    if (this.gameOver || this.won || this.firstClick) return null;
    const cell = this.cells[row][col];
    if (cell.revealed) return null;
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

const UI = {
  game: null,

  init() {
    document.getElementById('new-game-btn')
      .addEventListener('click', () => this.newGame());
    document.querySelectorAll('.diff-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.newGame(btn.dataset.level);
      })
    );
    this.newGame('easy');
  },

  newGame(level) {
    if (this.game) this.game._stopTimer();
    const activeLevel = level ||
      document.querySelector('.diff-btn.active').dataset.level;
    this.game = new Game(activeLevel);
    this._renderBoard();
    this._updateMineCounter();
    document.getElementById('time').textContent = '00:00';
    document.getElementById('message').textContent = '';
    document.getElementById('message').className = '';
    if (typeof Kostya !== 'undefined') Kostya.reset();
  },

  _renderBoard() {
    const boardEl = document.getElementById('board');
    const { rows, cols } = this.game;
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    boardEl.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const el = document.createElement('div');
        el.className = 'cell';
        el.dataset.row = r;
        el.dataset.col = c;
        el.addEventListener('click', () => this._handleReveal(r, c));
        el.addEventListener('contextmenu', e => {
          e.preventDefault();
          this._handleFlag(r, c);
        });
        boardEl.appendChild(el);
      }
    }
  },

  _getCellEl(row, col) {
    return document.querySelector(`#board [data-row="${row}"][data-col="${col}"]`);
  },

  _updateCellEl(row, col) {
    const el = this._getCellEl(row, col);
    const cell = this.game.cells[row][col];
    el.className = 'cell';
    delete el.dataset.num;
    el.textContent = '';
    if (cell.revealed) {
      el.classList.add('revealed');
      if (cell.count > 0) {
        el.textContent = cell.count;
        el.dataset.num = cell.count;
      }
    } else if (cell.flagged) {
      el.classList.add('flagged');
      el.textContent = '🚩';
    }
  },

  _refreshAllCells() {
    for (let r = 0; r < this.game.rows; r++)
      for (let c = 0; c < this.game.cols; c++)
        this._updateCellEl(r, c);
  },

  _updateMineCounter() {
    document.getElementById('mines-left').textContent =
      this.game.totalMines - this.game.flagCount;
  },

  _handleReveal(row, col) {
    const result = this.game.reveal(row, col);
    if (result.type === 'none') return;
    this._refreshAllCells();
    this._updateMineCounter();
    if (result.type === 'mine') {
      this._showGameOver(result.row, result.col);
    } else {
      this._scheduleKostyaSteals(result.steals);
      if (result.type === 'win') this._showWin();
    }
  },

  _handleFlag(row, col) {
    const result = this.game.toggleFlag(row, col);
    if (result !== null) {
      this._updateCellEl(row, col);
      this._updateMineCounter();
    }
  },

  _scheduleKostyaSteals(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const stolen = this.game.stealRandomFlag();
        if (stolen) {
          const [r, c] = stolen;
          Kostya.animateSteal(this._getCellEl(r, c), () => {
            this._updateCellEl(r, c);
            this._updateMineCounter();
          });
        } else {
          Kostya.animateDisappointed();
        }
      }, i * 1100 + 300);
    }
  },

  _showGameOver(hitRow, hitCol) {
    this.game.getAllMines().forEach(([r, c]) => {
      const el = this._getCellEl(r, c);
      el.classList.add('revealed', 'mine');
      el.textContent = '💣';
    });
    this._getCellEl(hitRow, hitCol).classList.add('mine-hit');
    const msg = document.getElementById('message');
    msg.textContent = 'GAME OVER';
    msg.className = 'lose';
  },

  _showWin() {
    const msg = document.getElementById('message');
    msg.textContent = 'YOU WIN!';
    msg.className = 'win';
    Confetti.start();
    setTimeout(() => Confetti.stop(), 3500);
  }
};
