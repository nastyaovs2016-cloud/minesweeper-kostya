# Minesweeper Kostya Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based pixel-art Minesweeper game with a saboteur character (Kostya) who steals flags every 5 revealed cells, deployed on GitHub Pages.

**Architecture:** Three static files (`index.html`, `style.css`, `game.js`) plus a PNG sprite served from `main` branch on GitHub Pages. Logic is split into a `Game` class (state/rules), a `UI` module (rendering + events), a `Kostya` module (character + animations), and a `Confetti` module (win effect).

**Tech Stack:** Vanilla JS ES6, CSS3 animations, Silkscreen font (Google Fonts), GitHub Pages

---

### Task 1: Project setup — copy sprite, create empty source files

**Files:**
- Copy: `~/Downloads/Kostya 3.png` → `kostya.png`
- Create: `index.html`, `style.css`, `game.js` (empty)

- [ ] **Step 1: Copy sprite and create source files**

```bash
cd /Users/Ovsyannikova_A/Documents/minesweeper-kostya
cp "/Users/Ovsyannikova_A/Downloads/Kostya 3.png" kostya.png
touch index.html style.css game.js
```

- [ ] **Step 2: Verify files exist**

```bash
ls /Users/Ovsyannikova_A/Documents/minesweeper-kostya
```
Expected output includes: `kostya.png`, `index.html`, `style.css`, `game.js`, `docs/`

- [ ] **Step 3: Commit**

```bash
cd /Users/Ovsyannikova_A/Documents/minesweeper-kostya
git add kostya.png index.html style.css game.js
git commit -m "feat: initial project structure with sprite"
```

---

### Task 2: HTML structure

**Files:**
- Write: `index.html`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minesweeper Kostya</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <div id="header">
      <div id="difficulty-selector">
        <button class="diff-btn active" data-level="easy">Easy</button>
        <button class="diff-btn" data-level="medium">Medium</button>
        <button class="diff-btn" data-level="hard">Hard</button>
        <button class="diff-btn" data-level="expert">Expert</button>
      </div>
    </div>
    <div id="game-container">
      <div id="sidebar">
        <div id="mine-counter">💣 <span id="mines-left">10</span></div>
        <div id="timer">⏱ <span id="time">00:00</span></div>
        <button id="new-game-btn">NEW GAME</button>
        <div id="message"></div>
      </div>
      <div id="board-wrapper">
        <div id="kostya-container">
          <div id="kostya-sprite">
            <img src="kostya.png" alt="Kostya">
            <div id="speech-bubble" class="hidden">Византично!</div>
          </div>
        </div>
        <div id="board"></div>
      </div>
    </div>
  </div>
  <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify structure**

Run: `open /Users/Ovsyannikova_A/Documents/minesweeper-kostya/index.html`

Expected: Page loads without console errors. Difficulty buttons and sidebar are visible (unstyled is fine at this step).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML structure"
```

---

### Task 3: CSS pixel-art styles and animations

**Files:**
- Write: `style.css`

- [ ] **Step 1: Write style.css**

```css
:root {
  --bg:               #C8956C;
  --cell-closed:      #D4956A;
  --cell-open:        #E8C49A;
  --cell-border-lt:   #E8B080;
  --cell-border-dk:   #7A4020;
  --board-bg:         #8B5E3C;
  --text:             #FFF8E8;
  --font:             'Silkscreen', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

#app {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- Difficulty buttons --- */
#difficulty-selector { display: flex; gap: 6px; }

.diff-btn {
  font-family: var(--font);
  font-size: 11px;
  padding: 6px 12px;
  background: #8B5E3C;
  color: var(--text);
  border: 2px solid;
  border-color: #A07050 #5A3010 #5A3010 #A07050;
  cursor: pointer;
  text-transform: uppercase;
}
.diff-btn:hover,
.diff-btn.active { background: #A07050; }

/* --- Game layout --- */
#game-container { display: flex; gap: 24px; align-items: flex-start; }

#sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 120px;
}

#mine-counter,
#timer {
  font-size: 18px;
  background: #6B3A1F;
  padding: 8px 12px;
  border: 2px solid #4A2010;
  letter-spacing: 1px;
}

#new-game-btn {
  font-family: var(--font);
  font-size: 12px;
  padding: 10px;
  background: #8B5E3C;
  color: var(--text);
  border: 2px solid;
  border-color: #A07050 #5A3010 #5A3010 #A07050;
  cursor: pointer;
  text-transform: uppercase;
}
#new-game-btn:hover { background: #A07050; }

#message {
  font-size: 16px;
  text-align: center;
  min-height: 28px;
  line-height: 1.4;
}
#message.win  { color: #90EE90; }
#message.lose { color: #FF6060; }

/* --- Board wrapper: holds Kostya above the board --- */
#board-wrapper {
  position: relative;
  padding-top: 90px;
}

#kostya-container {
  position: absolute;
  top: 0;
  right: -8px;
  z-index: 10;
}

#kostya-sprite {
  position: relative;
  width: 72px;
  transform-origin: 50% 20%;
  animation: swing-legs 1.5s ease-in-out infinite;
}

#kostya-sprite img {
  width: 72px;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Comic speech bubble */
#speech-bubble {
  position: absolute;
  top: 6px;
  right: 78px;
  background: #FFF8E8;
  color: #2a1005;
  font-family: var(--font);
  font-size: 9px;
  padding: 4px 8px;
  border: 2px solid #2a1005;
  white-space: nowrap;
}
#speech-bubble::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -9px;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-left-color: #2a1005;
}
#speech-bubble.hidden  { display: none; }
#speech-bubble.visible {
  display: block;
  animation: bubble-pop 0.2s ease-out;
}

/* --- Game board --- */
#board {
  display: grid;
  border: 4px solid var(--board-bg);
  background: var(--board-bg);
  gap: 2px;
  user-select: none;
}

.cell {
  width: 32px;
  height: 32px;
  background: var(--cell-closed);
  border: 2px solid;
  border-color: var(--cell-border-lt) var(--cell-border-dk) var(--cell-border-dk) var(--cell-border-lt);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-family: var(--font);
  font-weight: 700;
}

.cell.revealed {
  background: var(--cell-open);
  border-color: #C0885A;
  cursor: default;
}

.cell.mine     { background: var(--cell-open); }
.cell.mine-hit { background: #FF5050 !important; }

.cell[data-num="1"] { color: #2a8c1a; }
.cell[data-num="2"] { color: #1a5c8a; }
.cell[data-num="3"] { color: #c84820; }
.cell[data-num="4"] { color: #1a1a8c; }
.cell[data-num="5"] { color: #8c1a1a; }
.cell[data-num="6"] { color: #1a8c8c; }
.cell[data-num="7"] { color: #1a1a1a; }
.cell[data-num="8"] { color: #606060; }

/* --- Animations --- */
@keyframes swing-legs {
  0%, 100% { transform: rotate(-6deg); }
  50%       { transform: rotate(6deg);  }
}

@keyframes jump {
  0%   { transform: translateY(0)     rotate(0deg);  }
  35%  { transform: translateY(-18px) rotate(-5deg); }
  65%  { transform: translateY(-12px) rotate(5deg);  }
  100% { transform: translateY(0)     rotate(0deg);  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0)    rotate(0deg);  }
  25%      { transform: translateX(-6px) rotate(-4deg); }
  75%      { transform: translateX(6px)  rotate(4deg);  }
}

@keyframes bubble-pop {
  from { transform: scale(0.4); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

#kostya-sprite.jump  { animation: jump  0.45s ease-out; }
#kostya-sprite.shake { animation: shake 0.55s ease-in-out; }

/* Flying flag appended to <body> during steal animation */
.flying-flag {
  position: fixed;
  font-size: 20px;
  pointer-events: none;
  z-index: 1000;
}
```

- [ ] **Step 2: Open in browser and verify visual**

Reload the page.
Expected:
- Warm sandy `#C8956C` background fills the page
- Buttons styled in brown with pixel borders
- Sidebar labels use Silkscreen font
- No console errors

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add pixel-art CSS styles and Kostya animations"
```

---

### Task 4: Game class — core minesweeper logic

**Files:**
- Write: `game.js` (full file — will be extended in Tasks 5 and 6)

- [ ] **Step 1: Write the Game class to game.js**

```javascript
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
```

- [ ] **Step 2: Smoke-test in browser console**

Reload the page. Open DevTools → Console and run:
```javascript
const g = new Game('easy');
g._placeMines(4, 4);
console.log('mines:', g.getAllMines().length);         // → 10
const r = g.reveal(4, 4);
console.log('result type:', r.type);                   // → 'reveal' or 'win', NOT 'mine'
console.log('revealedCount >= 1:', g.revealedCount >= 1); // → true
```
Expected: no errors, mines = 10, first click is never a mine.

- [ ] **Step 3: Commit**

```bash
git add game.js
git commit -m "feat: add Game class with minesweeper core logic"
```

---

### Task 5: UI module — board rendering and event handling

**Files:**
- Modify: `game.js` — append `UI` object after the `Game` class

- [ ] **Step 1: Append the UI module to game.js**

Add the following at the end of `game.js`:

```javascript
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
    if (this.game.toggleFlag(row, col) !== false) {
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
```

- [ ] **Step 2: Temporarily add init call to verify board works**

At the very end of `game.js`, append:
```javascript
document.addEventListener('DOMContentLoaded', () => { UI.init(); });
```

- [ ] **Step 3: Open in browser and verify game is playable**

Reload the page.
Expected:
- 9×9 board renders on Easy
- Left-click reveals cells with correct numbers in correct colors
- Cascade works (clicking an empty area opens many cells)
- Right-click places 🚩, mine counter decreases
- Clicking a mine reveals all 💣, "GAME OVER" appears in red
- Difficulty buttons switch board size (Medium → 16×16, Hard 16 rows × 30 cols, Expert 24 rows × 30 cols)
- NEW GAME resets everything

- [ ] **Step 4: Remove the temporary init line** (will be replaced properly in Task 6)

Remove this line from the end of `game.js`:
```javascript
document.addEventListener('DOMContentLoaded', () => { UI.init(); });
```

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: add UI module with board rendering and game events"
```

---

### Task 6: Kostya module, Confetti module, and final init

**Files:**
- Modify: `game.js` — append Kostya, Confetti, and DOMContentLoaded

- [ ] **Step 1: Append Kostya, Confetti, and init to the end of game.js**

```javascript
const Kostya = {
  spriteEl: null,
  bubbleEl: null,

  init() {
    this.spriteEl = document.getElementById('kostya-sprite');
    this.bubbleEl = document.getElementById('speech-bubble');
  },

  reset() {
    this.spriteEl.classList.remove('jump', 'shake');
    this.bubbleEl.className = 'hidden';
  },

  // Animate flag flying from cellEl to Kostya, then call onFlagRemoved
  animateSteal(cellEl, onFlagRemoved) {
    const cellRect   = cellEl.getBoundingClientRect();
    const kostyaRect = this.spriteEl.getBoundingClientRect();

    const flyEl = document.createElement('div');
    flyEl.className = 'flying-flag';
    flyEl.textContent = '🚩';
    flyEl.style.left = (cellRect.left + cellRect.width  / 2 - 10) + 'px';
    flyEl.style.top  = (cellRect.top  + cellRect.height / 2 - 10) + 'px';
    flyEl.style.transition = 'none';
    document.body.appendChild(flyEl);

    // Two rAF frames ensure the initial position is painted before transition fires
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
      this._jump();
      this._showBubble();
    }, 560);
  },

  animateDisappointed() {
    this._shake();
  },

  _jump() {
    this.spriteEl.classList.remove('jump', 'shake');
    void this.spriteEl.offsetWidth; // force reflow to restart animation
    this.spriteEl.classList.add('jump');
    setTimeout(() => this.spriteEl.classList.remove('jump'), 460);
  },

  _shake() {
    this.spriteEl.classList.remove('jump', 'shake');
    void this.spriteEl.offsetWidth;
    this.spriteEl.classList.add('shake');
    setTimeout(() => this.spriteEl.classList.remove('shake'), 560);
  },

  _showBubble() {
    this.bubbleEl.className = 'visible';
    setTimeout(() => { this.bubbleEl.className = 'hidden'; }, 2200);
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
```

- [ ] **Step 2: Full end-to-end browser verification**

Reload the page and test all scenarios:

1. **Kostya idle**: Character visible top-right of board, gently swinging ~6° each way at 1.5s interval.
2. **Flag stealing**: Place 3 flags. Reveal cells one by one. After 5 reveals, a flag should fly toward Kostya, disappear, Kostya jumps, "Византично!" bubble shows for ~2s. Mine counter decreases.
3. **No flags left**: After all flags are stolen, reveal 5 more cells. Kostya shakes. No cell changes.
4. **Win**: On Easy, use right-click to flag all 10 mines, then reveal remaining cells. "YOU WIN!" appears in green, confetti falls.
5. **Game over**: Click a mine. All mines show 💣, the clicked mine highlights red, "GAME OVER" appears.
6. **New Game / difficulty switch**: Both reset the board cleanly, Kostya stops mid-animation.

- [ ] **Step 3: Commit**

```bash
git add game.js
git commit -m "feat: add Kostya steal animations, speech bubble, and confetti"
```

---

### Task 7: GitHub repository and Pages deployment

**Files:** No source files modified — repo setup only.

- [ ] **Step 1: Check if GitHub CLI is available**

```bash
gh --version
```
If not installed: `brew install gh`, then `gh auth login` and follow the prompts.

- [ ] **Step 2: Create the public GitHub repository and push**

```bash
cd /Users/Ovsyannikova_A/Documents/minesweeper-kostya
gh repo create minesweeper-kostya --public --source=. --remote=origin --push
```
Expected: all commits pushed to `https://github.com/<your-username>/minesweeper-kostya`

- [ ] **Step 3: Enable GitHub Pages**

```bash
gh api "repos/{owner}/minesweeper-kostya/pages" \
  --method POST \
  -f "source[branch]=main" \
  -f "source[path]=/"
```
Replace `{owner}` with your GitHub username (e.g. `nastya-ovs2016` — check with `gh api user --jq .login`).

Expected response includes `"html_url": "https://<username>.github.io/minesweeper-kostya"`.

- [ ] **Step 4: Verify the live site**

Wait 60–90 seconds, then open `https://<username>.github.io/minesweeper-kostya` in a browser.

Expected: Game loads fully, all 4 difficulty levels work, Kostya animates, flag stealing works, win/lose states work.
