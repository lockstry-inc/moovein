import { useEffect, useRef, useCallback, useState } from 'react'
import type { Floor } from '../../types/facility'

// ── Grid settings ──
const TILE = 40

interface Vec { x: number; y: number }
interface Ghost {
  pos: Vec
  dir: Vec
  color: string
  mode: 'chase' | 'scatter' | 'frightened'
  frightenedTimer: number
  scatterTarget: Vec
}

// Use flat Int32 key for dot lookup — zero-alloc
function dotKey(x: number, y: number, cols: number): number { return y * cols + x }

// ── Maze builder ──
function buildMaze(floor: Floor): { grid: boolean[][]; cols: number; rows: number } {
  const cols = Math.ceil(floor.width / TILE)
  const rows = Math.ceil(floor.height / TILE)
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(true))

  for (const u of floor.units) {
    const x0 = Math.floor(u.x / TILE)
    const y0 = Math.floor(u.y / TILE)
    const x1 = Math.ceil((u.x + u.w) / TILE)
    const y1 = Math.ceil((u.y + u.h) / TILE)
    for (let r = y0; r < y1 && r < rows; r++)
      for (let c = x0; c < x1 && c < cols; c++)
        grid[r][c] = false
  }

  for (const f of floor.siteFeatures) {
    const x0 = Math.floor(f.x / TILE)
    const y0 = Math.floor(f.y / TILE)
    const x1 = Math.ceil((f.x + f.w) / TILE)
    const y1 = Math.ceil((f.y + f.h) / TILE)
    for (let r = y0; r < y1 && r < rows; r++)
      for (let c = x0; c < x1 && c < cols; c++)
        grid[r][c] = false
  }

  for (let r = 0; r < rows; r++) { grid[r][0] = false; if (cols > 1) grid[r][cols - 1] = false }
  for (let c = 0; c < cols; c++) { grid[0][c] = false; if (rows > 1) grid[rows - 1][c] = false }

  return { grid, cols, rows }
}

// ── Dot / pellet placement — returns numeric sets + position arrays for fast rendering ──
function placeDots(grid: boolean[][], cols: number, rows: number) {
  const dotSet = new Set<number>()
  const dotPositions: Vec[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] && (r + c) % 2 === 0) {
        dotSet.add(dotKey(c, r, cols))
        dotPositions.push({ x: c, y: r })
      }
    }
  }
  return { dotSet, dotPositions }
}

function placePowerPellets(grid: boolean[][], cols: number, rows: number) {
  const pelletSet = new Set<number>()
  const pelletPositions: Vec[] = []

  const corners = [
    { startR: 0, endR: rows / 2, startC: 0, endC: cols / 2, dr: 1, dc: 1 },
    { startR: 0, endR: rows / 2, startC: cols - 1, endC: cols / 2, dr: 1, dc: -1 },
    { startR: rows - 1, endR: rows / 2, startC: 0, endC: cols / 2, dr: -1, dc: 1 },
    { startR: rows - 1, endR: rows / 2, startC: cols - 1, endC: cols / 2, dr: -1, dc: -1 },
  ]

  for (const corner of corners) {
    let found = false
    for (let r = corner.startR; !found && r !== corner.endR; r += corner.dr) {
      for (let c = corner.startC; !found && c !== corner.endC; c += corner.dc) {
        if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c]) {
          const k = dotKey(c, r, cols)
          pelletSet.add(k)
          pelletPositions.push({ x: c, y: r })
          found = true
        }
      }
    }
  }

  return { pelletSet, pelletPositions }
}

function findSpawn(grid: boolean[][], preferCol: number, preferRow: number): Vec {
  const rows = grid.length
  const cols = grid[0].length
  for (let d = 0; d < Math.max(rows, cols); d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.abs(dr) !== d && Math.abs(dc) !== d) continue
        const r = preferRow + dr
        const c = preferCol + dc
        if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c])
          return { x: c, y: r }
      }
    }
  }
  return { x: preferCol, y: preferRow }
}

const DIRS: Vec[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

function canMove(grid: boolean[][], pos: Vec, dir: Vec): boolean {
  const nx = pos.x + dir.x
  const ny = pos.y + dir.y
  if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) return false
  return grid[ny][nx]
}

function dist(a: Vec, b: Vec): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function ghostChooseDir(grid: boolean[][], ghost: Ghost, target: Vec): Vec {
  const opp = { x: -ghost.dir.x, y: -ghost.dir.y }
  let bestDir = ghost.dir
  let bestDist = Infinity
  for (const d of DIRS) {
    if (d.x === opp.x && d.y === opp.y) continue
    if (!canMove(grid, ghost.pos, d)) continue
    const dd = dist({ x: ghost.pos.x + d.x, y: ghost.pos.y + d.y }, target)
    if (dd < bestDist) { bestDist = dd; bestDir = d }
  }
  if (!canMove(grid, ghost.pos, bestDir)) return opp
  return bestDir
}

// ── Game state type ──
interface GameState {
  grid: boolean[][]
  cols: number
  rows: number
  dotSet: Set<number>
  dotPositions: Vec[]
  pelletSet: Set<number>
  pelletPositions: Vec[]
  pacman: { pos: Vec; dir: Vec; nextDir: Vec; mouthOpen: number; mouthDir: number }
  ghosts: Ghost[]
  score: number
  lives: number
  gameOver: boolean
  won: boolean
  moveTimer: number
  ghostMoveTimer: number
}

function createGameState(floor: Floor): GameState {
  const { grid, cols, rows } = buildMaze(floor)
  const { dotSet, dotPositions } = placeDots(grid, cols, rows)
  const { pelletSet, pelletPositions } = placePowerPellets(grid, cols, rows)

  // Remove pellet positions from dots
  for (const k of pelletSet) dotSet.delete(k)
  const filteredDotPositions = dotPositions.filter(d => dotSet.has(dotKey(d.x, d.y, cols)))

  const centerC = Math.floor(cols / 2)
  const centerR = Math.floor(rows / 2)
  const pacSpawn = findSpawn(grid, centerC, Math.floor(rows * 0.7))

  const ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']
  const scatterTargets = [
    { x: cols - 2, y: 1 },
    { x: 1, y: 1 },
    { x: cols - 2, y: rows - 2 },
    { x: 1, y: rows - 2 },
  ]

  return {
    grid, cols, rows,
    dotSet, dotPositions: filteredDotPositions,
    pelletSet, pelletPositions,
    pacman: { pos: pacSpawn, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, mouthOpen: 0, mouthDir: 1 },
    ghosts: ghostColors.map((color, i) => ({
      pos: findSpawn(grid, centerC + (i - 2) * 3, centerR),
      dir: DIRS[i % 4], color,
      mode: 'scatter' as const,
      frightenedTimer: 0,
      scatterTarget: scatterTargets[i],
    })),
    score: 0, lives: 3, gameOver: false, won: false,
    moveTimer: 0, ghostMoveTimer: 0,
  }
}

// ── Component ──
interface Props {
  floor: Floor
  onExit: () => void
}

export default function PacManGame({ floor, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const canvasSizedRef = useRef(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  // Track previous React-synced values to avoid unnecessary setState calls
  const prevScoreRef = useRef(0)
  const prevLivesRef = useRef(3)

  // Initialize game
  useEffect(() => {
    stateRef.current = createGameState(floor)
    canvasSizedRef.current = false
  }, [floor])

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!stateRef.current || stateRef.current.gameOver) return
      const pac = stateRef.current.pacman
      switch (e.key) {
        case 'ArrowUp': case 'w': e.preventDefault(); pac.nextDir = DIRS[0]; break
        case 'ArrowDown': case 's': e.preventDefault(); pac.nextDir = DIRS[2]; break
        case 'ArrowLeft': case 'a': e.preventDefault(); pac.nextDir = DIRS[3]; break
        case 'ArrowRight': case 'd': e.preventDefault(); pac.nextDir = DIRS[1]; break
        case 'Escape': onExit(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit])

  // Game loop
  const gameLoop = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!s || !canvas) return

    // Cache context once
    if (!ctxRef.current) ctxRef.current = canvas.getContext('2d')
    const ctx = ctxRef.current
    if (!ctx) return

    const { grid, cols, rows } = s

    // Size canvas once
    if (!canvasSizedRef.current) {
      canvas.width = cols * TILE
      canvas.height = rows * TILE
      canvasSizedRef.current = true
    }

    // ── Update ──
    const MOVE_INTERVAL = 5
    const GHOST_INTERVAL = 7

    s.moveTimer++
    s.ghostMoveTimer++

    // Move pac-man
    if (s.moveTimer >= MOVE_INTERVAL && !s.gameOver) {
      s.moveTimer = 0
      const pac = s.pacman

      if (canMove(grid, pac.pos, pac.nextDir)) pac.dir = pac.nextDir
      if (canMove(grid, pac.pos, pac.dir))
        pac.pos = { x: pac.pos.x + pac.dir.x, y: pac.pos.y + pac.dir.y }

      // Eat dots
      const key = dotKey(pac.pos.x, pac.pos.y, cols)
      if (s.dotSet.has(key)) {
        s.dotSet.delete(key)
        // Remove from positions array (swap-and-pop for O(1))
        const idx = s.dotPositions.findIndex(d => d.x === pac.pos.x && d.y === pac.pos.y)
        if (idx >= 0) {
          s.dotPositions[idx] = s.dotPositions[s.dotPositions.length - 1]
          s.dotPositions.pop()
        }
        s.score += 10
      }
      if (s.pelletSet.has(key)) {
        s.pelletSet.delete(key)
        const idx = s.pelletPositions.findIndex(d => d.x === pac.pos.x && d.y === pac.pos.y)
        if (idx >= 0) {
          s.pelletPositions[idx] = s.pelletPositions[s.pelletPositions.length - 1]
          s.pelletPositions.pop()
        }
        s.score += 50
        for (const g of s.ghosts) { g.mode = 'frightened'; g.frightenedTimer = 300 }
      }

      if (s.dotSet.size === 0 && s.pelletSet.size === 0) {
        s.won = true
        s.gameOver = true
        setWon(true)
        setGameOver(true)
      }

      pac.mouthOpen += pac.mouthDir * 0.3
      if (pac.mouthOpen > 1) { pac.mouthOpen = 1; pac.mouthDir = -1 }
      if (pac.mouthOpen < 0) { pac.mouthOpen = 0; pac.mouthDir = 1 }
    }

    // Move ghosts
    if (s.ghostMoveTimer >= GHOST_INTERVAL && !s.gameOver) {
      s.ghostMoveTimer = 0
      const pac = s.pacman

      for (const g of s.ghosts) {
        if (g.frightenedTimer > 0) {
          g.frightenedTimer--
          if (g.frightenedTimer <= 0) g.mode = 'chase'
        }

        if (g.mode !== 'frightened') {
          g.mode = Math.floor(Date.now() / 7000) % 2 === 0 ? 'scatter' : 'chase'
        }

        if (g.mode === 'frightened') {
          const available = DIRS.filter(d => canMove(grid, g.pos, d))
          if (available.length > 0) g.dir = available[Math.floor(Math.random() * available.length)]
          if (canMove(grid, g.pos, g.dir)) g.pos = { x: g.pos.x + g.dir.x, y: g.pos.y + g.dir.y }
          continue
        }

        const target = g.mode === 'scatter' ? g.scatterTarget : pac.pos
        g.dir = ghostChooseDir(grid, g, target)
        if (canMove(grid, g.pos, g.dir)) g.pos = { x: g.pos.x + g.dir.x, y: g.pos.y + g.dir.y }
      }

      // Collision check
      for (const g of s.ghosts) {
        if (g.pos.x !== s.pacman.pos.x || g.pos.y !== s.pacman.pos.y || s.gameOver) continue
        if (g.mode === 'frightened') {
          s.score += 200
          g.pos = findSpawn(grid, Math.floor(cols / 2), Math.floor(rows / 2))
          g.mode = 'chase'
          g.frightenedTimer = 0
        } else {
          s.lives--
          if (s.lives <= 0) {
            s.gameOver = true
            setGameOver(true)
          } else {
            const pacSpawn = findSpawn(grid, Math.floor(cols / 2), Math.floor(rows * 0.7))
            s.pacman.pos = pacSpawn
            s.pacman.dir = { x: 1, y: 0 }
            s.pacman.nextDir = { x: 1, y: 0 }
          }
        }
      }
    }

    // Sync React state only when changed (avoid re-renders every frame)
    if (s.score !== prevScoreRef.current) { prevScoreRef.current = s.score; setScore(s.score) }
    if (s.lives !== prevLivesRef.current) { prevLivesRef.current = s.lives; setLives(s.lives) }

    // ── Render ──
    const cw = canvas.width
    const ch = canvas.height
    ctx.clearRect(0, 0, cw, ch)

    // Draw dots — iterate pre-built position array, no string parsing
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)'
    for (let i = 0; i < s.dotPositions.length; i++) {
      const d = s.dotPositions[i]
      ctx.beginPath()
      ctx.arc(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Power pellets
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200)
    ctx.fillStyle = `rgba(255, 255, 200, ${pulse})`
    for (let i = 0; i < s.pelletPositions.length; i++) {
      const p = s.pelletPositions[i]
      ctx.beginPath()
      ctx.arc(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, 10, 0, Math.PI * 2)
      ctx.fill()
    }

    // Pac-man
    const pac = s.pacman
    const px = pac.pos.x * TILE + TILE / 2
    const py = pac.pos.y * TILE + TILE / 2
    const angle = Math.atan2(pac.dir.y, pac.dir.x)
    const mouthAngle = pac.mouthOpen * 0.4

    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(px, py, TILE * 0.45, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle)
    ctx.lineTo(px, py)
    ctx.fill()

    const eyeAngle = angle - Math.PI / 4
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(px + Math.cos(eyeAngle) * TILE * 0.2, py + Math.sin(eyeAngle) * TILE * 0.2, 3, 0, Math.PI * 2)
    ctx.fill()

    // Ghosts
    for (const g of s.ghosts) {
      const gx = g.pos.x * TILE + TILE / 2
      const gy = g.pos.y * TILE + TILE / 2
      const r = TILE * 0.45

      ctx.fillStyle = g.mode === 'frightened'
        ? (g.frightenedTimer < 60 && Math.floor(g.frightenedTimer / 8) % 2 === 0 ? '#ffffff' : '#2121de')
        : g.color

      ctx.beginPath()
      ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0)
      const waveY = gy + r * 0.6
      ctx.lineTo(gx + r, waveY)
      const segW = (r * 2) / 3
      for (let i = 0; i < 3; i++) {
        const sx = gx + r - segW * i
        ctx.quadraticCurveTo(sx - segW / 2, waveY + (i % 2 === 0 ? r * 0.3 : 0), sx - segW, waveY)
      }
      ctx.closePath()
      ctx.fill()

      if (g.mode !== 'frightened') {
        const eyeOff = r * 0.25
        for (const side of [-1, 1]) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.ellipse(gx + side * eyeOff, gy - r * 0.25, r * 0.2, r * 0.25, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#00f'
          ctx.beginPath()
          ctx.arc(gx + side * eyeOff + g.dir.x * 3, gy - r * 0.25 + g.dir.y * 3, r * 0.1, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        ctx.fillStyle = '#fff'
        for (const side of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(gx + side * r * 0.25, gy - r * 0.2, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(gx - r * 0.35, gy + r * 0.1)
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(
            gx - r * 0.35 + (r * 0.7 / 4) * (i + 0.5),
            gy + r * 0.1 + (i % 2 === 0 ? -3 : 3)
          )
        }
        ctx.stroke()
      }
    }
  }, [])

  // rAF loop
  useEffect(() => {
    let rafId: number
    const loop = () => { gameLoop(); rafId = requestAnimationFrame(loop) }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gameLoop])

  const handleRestart = () => {
    setScore(0); setLives(3); setGameOver(false); setWon(false)
    prevScoreRef.current = 0; prevLivesRef.current = 3
    stateRef.current = createGameState(floor)
    canvasSizedRef.current = false
  }

  return (
    <>
      <canvas ref={canvasRef} className="absolute top-0 left-0 z-50" style={{ imageRendering: 'pixelated' }} />

      {/* HUD */}
      <div
        className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-6 rounded-full"
        style={{ padding: '10px 28px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,204,0,0.3)' }}
      >
        <div className="text-[15px] font-bold" style={{ color: '#ffcc00' }}>PAC-MAN</div>
        <div className="text-[14px] font-semibold text-white">Score: {score}</div>
        <div className="text-[14px] font-semibold" style={{ color: '#ff6b6b' }}>{'♥'.repeat(lives)}</div>
        <button
          onClick={onExit}
          className="text-[12px] font-semibold cursor-pointer rounded-full transition-colors duration-150"
          style={{ padding: '4px 14px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          ESC to Exit
        </button>
      </div>

      {/* Game over / Win overlay */}
      {gameOver && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999]" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="flex flex-col items-center gap-4 rounded-[20px]" style={{ padding: '40px 60px', background: 'rgba(0,0,0,0.9)', border: `2px solid ${won ? '#2dd4a0' : '#ff6b6b'}` }}>
            <div className="text-[36px] font-bold" style={{ color: won ? '#2dd4a0' : '#ff6b6b' }}>
              {won ? 'YOU WIN!' : 'GAME OVER'}
            </div>
            <div className="text-[20px] font-semibold" style={{ color: '#ffcc00' }}>Score: {score}</div>
            <div className="flex gap-3 mt-2">
              <button onClick={handleRestart} className="text-[14px] font-semibold cursor-pointer rounded-full transition-all duration-200 hover:scale-[1.05]"
                style={{ padding: '10px 28px', background: won ? '#2dd4a0' : '#ffcc00', color: '#000', border: 'none' }}>
                Play Again
              </button>
              <button onClick={onExit} className="text-[14px] font-semibold cursor-pointer rounded-full transition-all duration-200 hover:scale-[1.05]"
                style={{ padding: '10px 28px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                Back to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
