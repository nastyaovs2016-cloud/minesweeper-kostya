# Minesweeper Kostya — Design Spec
**Date:** 2026-05-28  
**Status:** Approved

---

## Overview

A browser-based Minesweeper mini-game with a pixel-art style and a special saboteur character — Kostya — who steals flags from the board. Deployed as a static site on GitHub Pages from the `minesweeper-kostya` repository.

---

## File Structure

```
minesweeper-kostya/
├── index.html      # markup, difficulty selector, game board
├── style.css       # pixel art styling, animations
├── game.js         # minesweeper logic, flag-stealing mechanic
└── kostya.png      # character sprite (from Kostya 3.png)
```

No build tools or frameworks. GitHub Pages serves directly from the `main` branch.

---

## Visual Design

**Color palette** (inspired by the reference screenshot):
- Page background: warm sandy `#C8956C`
- Closed cells: `#D4956A` with dark border `#8B5E3C`
- Revealed cells: lighter `#E8C49A`
- Number colors: green for 1–2, yellow for 3–4, red for 5+
- Flags: red pixel-art triangles (CSS-drawn)
- Font: **Silkscreen** (Google Fonts) — pixel aesthetic throughout

**Layout:**
```
┌──────────────────────────────────────────┐
│  [Easy][Medium][Hard][Expert]   [Kostya] │
│                                  🧍‍♂️      │
│  💣 10    ┌─────────────┐               │
│  ⏱ 00:00  │  game board │               │
│           │             │               │
│  NEW GAME └─────────────┘               │
└──────────────────────────────────────────┘
```

Kostya sits on the top-right edge of the board, legs dangling over it.

---

## Difficulty Levels

| Level  | Grid  | Mines |
|--------|-------|-------|
| Easy   | 9×9   | 10    |
| Medium | 16×16 | 40    |
| Hard   | 30×16 | 99    |
| Expert | 30×24 | 160   |

---

## Game Mechanics

### Standard Minesweeper
- Left click: reveal a cell
- Right click: place/remove a flag
- First click is always safe — mines are generated after it
- Cascade reveal of empty cells (flood fill)
- Win condition: all non-mine cells revealed
- Loss condition: clicked on a mine — all mines revealed, game over

### Kostya — The Saboteur

**Trigger:** every 5 revealed cells (`openedCount % 5 === 0`), Kostya steals one random flag.

**If flags exist on the board:**
1. A random flagged cell is selected
2. CSS animation: the flag "flies" from the cell toward Kostya (`transform` + `transition`)
3. Kostya does a small "jump" animation
4. A comic-style speech bubble appears next to Kostya: **"Византично!"**
5. The bubble disappears after ~2 seconds
6. The cell remains closed but loses its flag — the player no longer knows it's a mine

**If no flags exist:**
- Kostya does a small head-shake animation ("looking displeased")
- No cell state changes

### Kostya Idle Animation
- Legs swing back and forth via `@keyframes swing` at 1.5s intervals
- Sprite is cropped/positioned to look like he's sitting on the board edge

---

## End States

**Loss:**
- All mines revealed on the board
- "GAME OVER" message displayed
- New Game button shown

**Win:**
- Congratulation message shown
- CSS confetti animation plays
- Final time and move count displayed

---

## GitHub Pages Deployment

- Repository name: `minesweeper-kostya`
- Pages served from `main` branch root (`/`)
- No build step needed — push files and enable Pages in repo settings
