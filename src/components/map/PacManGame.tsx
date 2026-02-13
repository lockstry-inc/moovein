import { useEffect, useRef, useCallback, useState } from 'react'
import type { Floor } from '../../types/facility'

// ── Grid settings ──
// Downsample the 4800×5200 floor to a coarser tile grid for pathfinding
const TILE = 40 // each tile = 40px in floor-space

interface Vec { x: number; y: number }
interface Ghost {
  pos: Vec
  dir: Vec
  color: string
  mode: 'chase' | 'scatter' | 'frightened'
  frightenedTimer: number
  scatterTarget: Vec
}

// ── Maze builder ──
function buildMaze(floor: Floor): boolean[][] {
  const cols = Math.ceil(floor.width / TILE)
  const rows = Math.ceil(floor.height / TILE)
  // Start with everything walkable
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(true))

  // Mark unit tiles as walls
  for (const u of floor.units) {
    const x0 = Math.floor(u.x / TILE)
    const y0 = Math.floor(u.y / TILE)
    const x1 = Math.ceil((u.x + u.w) / TILE)
    const y1 = Math.ceil((u.y + u.h) / TILE)
    for (let r = y0; r < y1 && r < rows; r++) {
      for (let c = x0; c < x1 && c < cols; c++) {
        grid[r][c] = false
      }
    }
  }

  // Also mark site features (office, elevator, stairs) as walls
  for (const f of floor.siteFeatures) {
    const x0 = Math.floor(f.x / TILE)
    const y0 = Math.floor(f.y / TILE)
    const x1 = Math.ceil((f.x + f.w) / TILE)
    const y1 = Math.ceil((f.y + f.h) / TILE)
    for (let r = y0; r < y1 && r < rows; r++) {
      for (let c = x0; c < x1 && c < cols; c++) {
        grid[r][c] = false
      }
    }
  }

  // Mark outer border as walls (1 tile margin)
  for (let r = 0; r < rows; r++) {
    grid[r][0] = false
    if (cols > 1) grid[r][cols - 1] = false
  }
  for (let c = 0; c < cols; c++) {
    grid[0][c] = false
    if (rows > 1) grid[rows - 1][c] = false
  }

  return grid
}

// ── Dot placement ──
function placeDots(grid: boolean[][]): Set<string> {
  const dots = new Set<string>()
  const rows = grid.length
  const cols = grid[0].length
  // Place dot on every other walkable tile
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] && (r + c) % 2 === 0) {
        dots.add(`${c},${r}`)
      }
    }
  }
  return dots
}

// ── Power pellet placement (4 corners of walkable area) ──
function placePowerPellets(grid: boolean[][]): Set<string> {
  const pellets = new Set<string>()
  const rows = grid.length
  const cols = grid[0].length

  // Find walkable tiles near each corner
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
          pellets.add(`${c},${r}`)
          found = true
        }
      }
    }
  }

  return pellets
}

// ── Find a walkable spawn point ──
function findSpawn(grid: boolean[][], preferCol: number, preferRow: number): Vec {
  const rows = grid.length
  const cols = grid[0].length
  // Spiral outward from preferred position
  for (let d = 0; d < Math.max(rows, cols); d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.abs(dr) !== d && Math.abs(dc) !== d) continue
        const r = preferRow + dr
        const c = preferCol + dc
        if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c]) {
          return { x: c, y: r }
        }
      }
    }
  }
  return { x: preferCol, y: preferRow }
}

// ── Directions ──
const DIRS: Vec[] = [
  { x: 0, y: -1 }, // up
  { x: 1, y: 0 },  // right
  { x: 0, y: 1 },  // down
  { x: -1, y: 0 }, // left
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

function oppositeDir(d: Vec): Vec {
  return { x: -d.x, y: -d.y }
}

// ── Ghost AI: pick direction toward target, never reverse ──
function ghostChooseDir(grid: boolean[][], ghost: Ghost, target: Vec): Vec {
  const opp = oppositeDir(ghost.dir)
  let bestDir = ghost.dir
  let bestDist = Infinity

  for (const d of DIRS) {
    if (d.x === opp.x && d.y === opp.y) continue // no reversals
    if (!canMove(grid, ghost.pos, d)) continue
    const next = { x: ghost.pos.x + d.x, y: ghost.pos.y + d.y }
    const dd = dist(next, target)
    if (dd < bestDist) {
      bestDist = dd
      bestDir = d
    }
  }

  // If stuck (can't move anywhere except reverse), reverse
  if (!canMove(grid, ghost.pos, bestDir)) {
    return opp
  }

  return bestDir
}

// ── Component ──
interface Props {
  floor: Floor
  onExit: () => void
}

export default function PacManGame({ floor, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    grid: boolean[][]
    dots: Set<string>
    pellets: Set<string>
    pacman: { pos: Vec; dir: Vec; nextDir: Vec; mouthOpen: number; mouthDir: number }
    ghosts: Ghost[]
    score: number
    lives: number
    gameOver: boolean
    won: boolean
    moveTimer: number
    ghostMoveTimer: number
    totalDots: number
  } | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  // Initialize game
  useEffect(() => {
    const grid = buildMaze(floor)
    const dots = placeDots(grid)
    const pellets = placePowerPellets(grid)
    // Remove pellet positions from dots
    for (const p of pellets) dots.delete(p)

    const cols = grid[0].length
    const rows = grid.length
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

    const ghosts: Ghost[] = ghostColors.map((color, i) => ({
      pos: findSpawn(grid, centerC + (i - 2) * 3, centerR),
      dir: DIRS[i % 4],
      color,
      mode: 'scatter' as const,
      frightenedTimer: 0,
      scatterTarget: scatterTargets[i],
    }))

    stateRef.current = {
      grid,
      dots,
      pellets,
      pacman: {
        pos: pacSpawn,
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        mouthOpen: 0,
        mouthDir: 1,
      },
      ghosts,
      score: 0,
      lives: 3,
      gameOver: false,
      won: false,
      moveTimer: 0,
      ghostMoveTimer: 0,
      totalDots: dots.size + pellets.size,
    }
  }, [floor])

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!stateRef.current || stateRef.current.gameOver) return
      const pac = stateRef.current.pacman
      switch (e.key) {
        case 'ArrowUp': case 'w': e.preventDefault(); pac.nextDir = { x: 0, y: -1 }; break
        case 'ArrowDown': case 's': e.preventDefault(); pac.nextDir = { x: 0, y: 1 }; break
        case 'ArrowLeft': case 'a': e.preventDefault(); pac.nextDir = { x: -1, y: 0 }; break
        case 'ArrowRight': case 'd': e.preventDefault(); pac.nextDir = { x: 1, y: 0 }; break
        case 'Escape': onExit(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit])

  // Game loop — canvas rendering
  const gameLoop = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!s || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const grid = s.grid
    const rows = grid.length
    const cols = grid[0].length

    // ── Update ──
    const MOVE_INTERVAL = 5
    const GHOST_INTERVAL = 7

    s.moveTimer++
    s.ghostMoveTimer++

    // Move pac-man
    if (s.moveTimer >= MOVE_INTERVAL && !s.gameOver) {
      s.moveTimer = 0
      const pac = s.pacman

      // Try queued direction first
      if (canMove(grid, pac.pos, pac.nextDir)) {
        pac.dir = pac.nextDir
      }

      if (canMove(grid, pac.pos, pac.dir)) {
        pac.pos = { x: pac.pos.x + pac.dir.x, y: pac.pos.y + pac.dir.y }
      }

      // Eat dots
      const key = `${pac.pos.x},${pac.pos.y}`
      if (s.dots.has(key)) {
        s.dots.delete(key)
        s.score += 10
        setScore(s.score)
      }
      if (s.pellets.has(key)) {
        s.pellets.delete(key)
        s.score += 50
        setScore(s.score)
        // Frighten ghosts
        for (const g of s.ghosts) {
          g.mode = 'frightened'
          g.frightenedTimer = 300 // ~5 seconds at 60fps
        }
      }

      // Check win
      if (s.dots.size === 0 && s.pellets.size === 0) {
        s.won = true
        s.gameOver = true
        setWon(true)
        setGameOver(true)
      }

      // Mouth animation
      pac.mouthOpen += pac.mouthDir * 0.3
      if (pac.mouthOpen > 1) { pac.mouthOpen = 1; pac.mouthDir = -1 }
      if (pac.mouthOpen < 0) { pac.mouthOpen = 0; pac.mouthDir = 1 }
    }

    // Move ghosts
    if (s.ghostMoveTimer >= GHOST_INTERVAL && !s.gameOver) {
      s.ghostMoveTimer = 0
      const pac = s.pacman

      for (const g of s.ghosts) {
        // Decrement frightened timer
        if (g.frightenedTimer > 0) {
          g.frightenedTimer--
          if (g.frightenedTimer <= 0) g.mode = 'chase'
        }

        // Alternate between chase and scatter every ~7s
        if (g.mode !== 'frightened') {
          const cycle = Math.floor(Date.now() / 7000) % 2
          g.mode = cycle === 0 ? 'scatter' : 'chase'
        }

        let target: Vec
        if (g.mode === 'frightened') {
          // Random direction
          const available = DIRS.filter(d => canMove(grid, g.pos, d))
          if (available.length > 0) {
            g.dir = available[Math.floor(Math.random() * available.length)]
          }
          if (canMove(grid, g.pos, g.dir)) {
            g.pos = { x: g.pos.x + g.dir.x, y: g.pos.y + g.dir.y }
          }
          continue
        } else if (g.mode === 'scatter') {
          target = g.scatterTarget
        } else {
          target = pac.pos
        }

        g.dir = ghostChooseDir(grid, g, target)
        if (canMove(grid, g.pos, g.dir)) {
          g.pos = { x: g.pos.x + g.dir.x, y: g.pos.y + g.dir.y }
        }
      }

      // Collision check (all ghosts vs pac-man)
      for (const g of s.ghosts) {
        if (g.pos.x !== pac.pos.x || g.pos.y !== pac.pos.y || s.gameOver) continue
        if (g.mode === 'frightened') {
          // Eat ghost
          s.score += 200
          setScore(s.score)
          const centerC = Math.floor(cols / 2)
          const centerR = Math.floor(rows / 2)
          g.pos = findSpawn(grid, centerC, centerR)
          g.mode = 'chase'
          g.frightenedTimer = 0
        } else {
          // Lose a life
          s.lives--
          setLives(s.lives)
          if (s.lives <= 0) {
            s.gameOver = true
            setGameOver(true)
          } else {
            const pacSpawn = findSpawn(grid, Math.floor(cols / 2), Math.floor(rows * 0.7))
            pac.pos = pacSpawn
            pac.dir = { x: 1, y: 0 }
            pac.nextDir = { x: 1, y: 0 }
          }
        }
      }
    }

    // ── Render ──
    const cw = cols * TILE
    const ch = rows * TILE
    canvas.width = cw
    canvas.height = ch
    ctx.clearRect(0, 0, cw, ch)

    // Draw dots
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)'
    for (const d of s.dots) {
      const [cx, cy] = d.split(',').map(Number)
      ctx.beginPath()
      ctx.arc(cx * TILE + TILE / 2, cy * TILE + TILE / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw power pellets (larger, pulsing)
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200)
    ctx.fillStyle = `rgba(255, 255, 200, ${pulse})`
    for (const p of s.pellets) {
      const [cx, cy] = p.split(',').map(Number)
      ctx.beginPath()
      ctx.arc(cx * TILE + TILE / 2, cy * TILE + TILE / 2, 10, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw pac-man
    const pac = s.pacman
    const px = pac.pos.x * TILE + TILE / 2
    const py = pac.pos.y * TILE + TILE / 2
    const angle = Math.atan2(pac.dir.y, pac.dir.x)
    const mouthAngle = pac.mouthOpen * 0.4 // max 0.4 radians

    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(px, py, TILE * 0.45, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle)
    ctx.lineTo(px, py)
    ctx.fill()

    // Pac-man eye
    const eyeAngle = angle - Math.PI / 4
    const eyeX = px + Math.cos(eyeAngle) * TILE * 0.2
    const eyeY = py + Math.sin(eyeAngle) * TILE * 0.2
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw ghosts
    for (const g of s.ghosts) {
      const gx = g.pos.x * TILE + TILE / 2
      const gy = g.pos.y * TILE + TILE / 2
      const r = TILE * 0.45

      ctx.fillStyle = g.mode === 'frightened'
        ? (g.frightenedTimer < 60 && Math.floor(g.frightenedTimer / 8) % 2 === 0 ? '#ffffff' : '#2121de')
        : g.color

      // Ghost body (rounded top, wavy bottom)
      ctx.beginPath()
      ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0) // dome
      // Wavy bottom
      const waveY = gy + r * 0.6
      ctx.lineTo(gx + r, waveY)
      const segments = 3
      const segW = (r * 2) / segments
      for (let i = 0; i < segments; i++) {
        const sx = gx + r - segW * i
        const dip = i % 2 === 0 ? r * 0.3 : 0
        ctx.quadraticCurveTo(sx - segW / 2, waveY + dip, sx - segW, waveY)
      }
      ctx.closePath()
      ctx.fill()

      // Ghost eyes
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
        // Frightened face
        ctx.fillStyle = '#fff'
        for (const side of [-1, 1]) {
          ctx.beginPath()
          ctx.arc(gx + side * r * 0.25, gy - r * 0.2, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        // Wavy mouth
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(gx - r * 0.35, gy + r * 0.1)
        for (let i = 0; i < 4; i++) {
          const mx = gx - r * 0.35 + (r * 0.7 / 4) * (i + 0.5)
          const my = gy + r * 0.1 + (i % 2 === 0 ? -3 : 3)
          ctx.lineTo(mx, my)
        }
        ctx.stroke()
      }
      ctx.fillStyle = g.color // reset for next
    }
  }, [])

  // Animation frame loop
  useEffect(() => {
    let rafId: number
    const loop = () => {
      gameLoop()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gameLoop])

  const handleRestart = () => {
    setScore(0)
    setLives(3)
    setGameOver(false)
    setWon(false)

    const grid = buildMaze(floor)
    const dots = placeDots(grid)
    const pellets = placePowerPellets(grid)
    for (const p of pellets) dots.delete(p)

    const cols = grid[0].length
    const rows = grid.length
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

    stateRef.current = {
      grid,
      dots,
      pellets,
      pacman: {
        pos: pacSpawn,
        dir: { x: 1, y: 0 },
        nextDir: { x: 1, y: 0 },
        mouthOpen: 0,
        mouthDir: 1,
      },
      ghosts: ghostColors.map((color, i) => ({
        pos: findSpawn(grid, centerC + (i - 2) * 3, centerR),
        dir: DIRS[i % 4],
        color,
        mode: 'scatter' as const,
        frightenedTimer: 0,
        scatterTarget: scatterTargets[i],
      })),
      score: 0,
      lives: 3,
      gameOver: false,
      won: false,
      moveTimer: 0,
      ghostMoveTimer: 0,
      totalDots: dots.size + pellets.size,
    }
  }

  return (
    <>
      {/* Game canvas — positioned in floor coordinate space */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-50"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD — fixed to screen, not floor space */}
      <div
        className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-6 rounded-full"
        style={{
          padding: '10px 28px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,204,0,0.3)',
        }}
      >
        <div className="text-[15px] font-bold" style={{ color: '#ffcc00' }}>
          PAC-MAN
        </div>
        <div className="text-[14px] font-semibold text-white">
          Score: {score}
        </div>
        <div className="text-[14px] font-semibold" style={{ color: '#ff6b6b' }}>
          {'♥'.repeat(lives)}
        </div>
        <button
          onClick={onExit}
          className="text-[12px] font-semibold cursor-pointer rounded-full transition-colors duration-150"
          style={{
            padding: '4px 14px',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          ESC to Exit
        </button>
      </div>

      {/* Game over / Win overlay */}
      {gameOver && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-[20px]"
            style={{
              padding: '40px 60px',
              background: 'rgba(0,0,0,0.9)',
              border: `2px solid ${won ? '#2dd4a0' : '#ff6b6b'}`,
            }}
          >
            <div className="text-[36px] font-bold" style={{ color: won ? '#2dd4a0' : '#ff6b6b' }}>
              {won ? 'YOU WIN!' : 'GAME OVER'}
            </div>
            <div className="text-[20px] font-semibold" style={{ color: '#ffcc00' }}>
              Score: {score}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleRestart}
                className="text-[14px] font-semibold cursor-pointer rounded-full transition-all duration-200 hover:scale-[1.05]"
                style={{
                  padding: '10px 28px',
                  background: won ? '#2dd4a0' : '#ffcc00',
                  color: '#000',
                  border: 'none',
                }}
              >
                Play Again
              </button>
              <button
                onClick={onExit}
                className="text-[14px] font-semibold cursor-pointer rounded-full transition-all duration-200 hover:scale-[1.05]"
                style={{
                  padding: '10px 28px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                Back to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
