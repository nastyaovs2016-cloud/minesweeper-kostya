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
    this.flagsPlacedSinceLastSteal = 0;
    this.nextStealThreshold = this._randomThreshold();
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

  // Returns { type: 'none'|'mine'|'reveal'|'win', row?: number, col?: number }
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

    if (this.revealedCount >= this.rows * this.cols - this.totalMines) {
      this.won = true;
      this._stopTimer();
      return { type: 'win' };
    }
    return { type: 'reveal' };
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

  // Returns { placed: bool, steals: 0|1 } or null (not allowed)
  toggleFlag(row, col) {
    if (this.gameOver || this.won || this.firstClick) return null;
    const cell = this.cells[row][col];
    if (cell.revealed) return null;
    cell.flagged = !cell.flagged;
    this.flagCount += cell.flagged ? 1 : -1;
    let steals = 0;
    if (cell.flagged) {
      this.flagsPlacedSinceLastSteal++;
      if (this.flagsPlacedSinceLastSteal >= this.nextStealThreshold) {
        this.flagsPlacedSinceLastSteal = 0;
        this.nextStealThreshold = this._randomThreshold();
        steals = 1;
      }
    }
    return { placed: cell.flagged, steals };
  }

  _randomThreshold() {
    return Math.random() < 0.5 ? 3 : 5;
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
    if (typeof Confetti !== 'undefined') Confetti.stop();
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
    } else if (result.type === 'win') {
      this._showWin();
    }
  },

  _handleFlag(row, col) {
    const result = this.game.toggleFlag(row, col);
    if (result !== null) {
      this._updateCellEl(row, col);
      this._updateMineCounter();
      this._scheduleKostyaSteals(result.steals);
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
    Kostya.animateLose();
  },

  _showWin() {
    const msg = document.getElementById('message');
    msg.textContent = 'YOU WIN!';
    msg.className = 'win';
    Kostya.animateWin();
    Confetti.start();
    setTimeout(() => Confetti.stop(), 3500);
  }
};

const Kostya = {
  imgEl: null,
  bubbleEl: null,

  init() {
    this.imgEl   = document.getElementById('kostya-img');
    this.bubbleEl = document.getElementById('speech-bubble');
  },

  reset() {
    this.imgEl.src = 'pixel_character_stomp_v2.gif';
    this.bubbleEl.className = 'hidden';
  },

  animateSteal(cellEl, onFlagRemoved) {
    const cellRect   = cellEl.getBoundingClientRect();
    const kostyaRect = this.imgEl.getBoundingClientRect();

    const flyEl = document.createElement('div');
    flyEl.className = 'flying-flag';
    flyEl.textContent = '🚩';
    flyEl.style.left = (cellRect.left + cellRect.width  / 2 - 10) + 'px';
    flyEl.style.top  = (cellRect.top  + cellRect.height / 2 - 10) + 'px';
    flyEl.style.transition = 'none';
    document.body.appendChild(flyEl);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      flyEl.style.transition = 'left 0.5s ease-in, top 0.5s ease-in, opacity 0.5s, transform 0.5s';
      flyEl.style.left      = (kostyaRect.left + kostyaRect.width  / 2 - 10) + 'px';
      flyEl.style.top       = (kostyaRect.top  + kostyaRect.height / 2 - 10) + 'px';
      flyEl.style.opacity   = '0';
      flyEl.style.transform = 'scale(0.2)';
    }));

    setTimeout(() => {
      flyEl.remove();
      onFlagRemoved();
      this.imgEl.src = 'pointing.gif';
      this._showBubble(() => {
        this.imgEl.src = 'pixel_character_stomp_v2.gif';
      });
    }, 560);
  },

  animateDisappointed() {
    // no flags to steal — do nothing
  },

  animateLose() {
    this.imgEl.src = 'happy_jump.gif';
    this.bubbleEl.className = 'hidden';
  },

  animateWin() {
    this.imgEl.src = 'panic_scream.gif';
    this.bubbleEl.className = 'hidden';
  },

  _showBubble(onHide) {
    this.bubbleEl.className = 'visible';
    setTimeout(() => {
      this.bubbleEl.className = 'hidden';
      if (onHide) onHide();
    }, 2200);
  }
};

const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animId: null,

  start() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;';
      document.body.appendChild(this.canvas);
    }
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    this.particles = Array.from({ length: 80 }, () => ({
      x:    Math.random() * this.canvas.width,
      y:    -(Math.random() * this.canvas.height * 0.5),
      w:    6 + Math.random() * 10,
      h:    3 + Math.random() * 6,
      color: `hsl(${Math.random() * 360},80%,60%)`,
      vy:   2 + Math.random() * 3,
      vx:   (Math.random() - 0.5) * 2,
      rot:  Math.random() * Math.PI * 2,
      drot: (Math.random() - 0.5) * 0.15
    }));
    if (this.animId) cancelAnimationFrame(this.animId);
    this._draw();
  },

  _draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let alive = false;
    this.particles.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.rot += p.drot;
      if (p.y < this.canvas.height + 20) alive = true;
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    });
    this.animId = alive
      ? requestAnimationFrame(() => this._draw())
      : (this.stop(), null);
  },

  stop() {
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
    if (this.canvas) { this.canvas.remove(); this.canvas = null; }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Kostya.init();
  UI.init();
});
