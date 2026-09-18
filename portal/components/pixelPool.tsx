import { useEffect, useRef } from 'react'

const gapRatio = 0.09
const radiusRatio = 0.1
const introSeconds = 1.4
const spreadRate = 8
const drainRate = 0.55
const pourRate = 1.6
const surfaceRate = 4
const wobbleCells = 2
const wobbleSpeed = 0.35

const trailLifeSeconds = 4
const trailRadiusRatio = 0.35
const trailPeak = 0.7
const trailSampleLimit = 24

const ground = '#ffffff'
const gridColor = '#efefef'
const tones = [
  [255, 70, 0],
  [255, 107, 51],
  [255, 138, 92],
  [255, 164, 125],
]
const trailTone = [255, 237, 230]

const defaultCellSize = 11.9
const defaultFloorHeight = 0.2
const defaultEdgeHeight = 0.82

const defaultQuietZone = { centerY: 0.5, height: 0.3, padding: 1.6, width: 0.5 }

type QuietZone = {
  centerY: number
  height: number
  padding: number
  width: number
}

type PixelPoolProps = {
  cellSize?: number
  className?: string
  edgeHeight?: number
  floorHeight?: number
  quietZone?: QuietZone | null
}

const permutation = (function buildPermutation() {
  const table = new Uint8Array(256)
  const source = Array.from({ length: 256 }, (_, i) => i)
  let seed = 1337
  for (let i = 255; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[source[i], source[j]] = [source[j], source[i]]
  }
  for (let i = 0; i < 256; i++) {
    table[i] = source[i]
  }
  return table
})()

const smoothstep = (t: number) => t * t * (3 - 2 * t)

const hash = (x: number, y: number) =>
  permutation[(permutation[x & 255] + (y & 255)) & 255] / 255

function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const u = smoothstep(x - xi)
  const v = smoothstep(y - yi)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function poolFloor(u: number, floor: number, edge: number) {
  const v = Math.abs(u - 0.5) * 2
  return floor + (edge - floor) * v * v
}

const toneSteps = 8
const palette = tones.map(tone =>
  Array.from({ length: toneSteps + 1 }, function mixTowardsTrail(_, step) {
    const amount = step / toneSteps
    const r = Math.round(tone[0] + (trailTone[0] - tone[0]) * amount)
    const g = Math.round(tone[1] + (trailTone[1] - tone[1]) * amount)
    const b = Math.round(tone[2] + (trailTone[2] - tone[2]) * amount)
    return `rgb(${r},${g},${b})`
  }),
)

export const PixelPool = function ({
  cellSize = defaultCellSize,
  className = 'relative size-full',
  edgeHeight = defaultEdgeHeight,
  floorHeight = defaultFloorHeight,
  quietZone = defaultQuietZone,
}: PixelPoolProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(
    function runPool() {
      const panel = panelRef.current
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!panel || !canvas || !ctx) {
        return undefined
      }

      const reduce =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

      let width = 0
      let height = 0
      let cell = 11
      let cols = 0
      let rows = 0
      let level: Float32Array = new Float32Array(0)
      let surface: Float32Array = new Float32Array(0)
      let trailStrength: Float32Array = new Float32Array(0)
      let keep = { x0: 0, x1: 0, y0: 0, y1: 0 }

      const pointer = { inside: false, speed: 0, x: -1, y: -1 }
      const smoothed = { strength: 0, x: 0.5, y: 0.5 }
      const trail: { age: number; col: number; row: number }[] = []

      const startedAt = performance.now()
      let previous = startedAt
      let raf = 0
      let onScreen = true

      function introProgress() {
        if (reduce) {
          return 1
        }
        const elapsed = (performance.now() - startedAt) / 1000
        return smoothstep(clamp(elapsed / introSeconds, 0, 1))
      }

      function resize() {
        if (panel!.clientWidth === 0 || panel!.clientHeight === 0) {
          return
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        width = panel!.clientWidth
        height = panel!.clientHeight
        canvas!.width = Math.round(width * dpr)
        canvas!.height = Math.round(height * dpr)
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

        cols = Math.max(4, Math.round(width / cellSize))
        cell = width / cols
        rows = Math.ceil(height / Math.max(cell, 1)) + 1

        if (quietZone) {
          const padding = cell * quietZone.padding
          const boxWidth = width * quietZone.width
          const boxHeight = height * quietZone.height
          const centerY = height * quietZone.centerY
          keep = {
            x0: width / 2 - boxWidth / 2 - padding,
            x1: width / 2 + boxWidth / 2 + padding,
            y0: centerY - boxHeight / 2 - padding,
            y1: centerY + boxHeight / 2 + padding,
          }
        } else {
          keep = { x0: -Infinity, x1: -Infinity, y0: -Infinity, y1: -Infinity }
        }

        const introFill = introProgress()
        const filled = smoothstep(introFill)
        level = new Float32Array(cols).fill(introFill)
        surface = new Float32Array(cols)
        for (let c = 0; c < cols; c++) {
          surface[c] =
            poolFloor((c + 0.5) / cols, floorHeight, edgeHeight) * filled
        }
        trailStrength = new Float32Array(cols * rows)
        trail.length = 0
      }

      function advanceLevels(dt: number, introFill: number) {
        if (introFill < 1) {
          level.fill(introFill)
          return
        }
        if (pointer.inside) {
          const pour = dt * (pourRate + pointer.speed * pourRate * 4.4)
          for (let c = 0; c < cols; c++) {
            const du = ((c + 0.5) / cols - pointer.x / width) / 0.1
            level[c] += pour * Math.exp(-du * du)
          }
          pointer.speed *= Math.exp(-dt * 6)
        }
        const next = level.slice()
        for (let c = 0; c < cols; c++) {
          const left = c > 0 ? level[c - 1] : level[c]
          const right = c < cols - 1 ? level[c + 1] : level[c]
          let v = level[c] + dt * spreadRate * (left + right - 2 * level[c])
          v += (1 - v) * dt * (pointer.inside ? 0.06 : drainRate)
          next[c] = clamp(v, 0, 1)
        }
        level = next
      }

      function advanceTrail(dt: number) {
        if (pointer.inside) {
          const col = Math.floor(pointer.x / Math.max(cell, 1e-4))
          const row = Math.floor((height - pointer.y) / Math.max(cell, 1e-4))
          const last = trail[trail.length - 1]
          if (!last || last.col !== col || last.row !== row) {
            trail.push({ age: 0, col, row })
            if (trail.length > trailSampleLimit) {
              trail.shift()
            }
          }
        }
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].age += dt
          if (trail[i].age >= trailLifeSeconds) {
            trail.splice(i, 1)
          }
        }
      }

      function paintTrailStrength() {
        trailStrength.fill(0)
        const radiusCells = clamp((height * trailRadiusRatio) / cell, 1, rows)
        const reach = Math.ceil(radiusCells)
        const radiusSq = radiusCells * radiusCells
        for (const sample of trail) {
          const life = 1 - sample.age / trailLifeSeconds
          for (let dc = -reach; dc <= reach; dc++) {
            for (let dr = -reach; dr <= reach; dr++) {
              const c = sample.col + dc
              const r = sample.row + dr
              if (c < 0 || c >= cols || r < 0 || r >= rows) {
                continue
              }
              const offsetSq = dc * dc + dr * dr
              if (offsetSq >= radiusSq) {
                continue
              }
              const falloff = 1 - Math.sqrt(offsetSq / radiusSq)
              const strength = falloff * falloff * life
              const index = r * cols + c
              if (strength > trailStrength[index]) {
                trailStrength[index] = strength
              }
            }
          }
        }
      }

      function columnHeight(c: number, seconds: number, fill: number) {
        const u = (c + 0.5) / cols
        let h = poolFloor(u, floorHeight, edgeHeight) * fill
        const wobbleAmount = (wobbleCells * cell) / height
        h +=
          (noise(u * 3 + seconds * wobbleSpeed, seconds * wobbleSpeed * 1.25) -
            0.5) *
          wobbleAmount *
          fill

        const d = (u - smoothed.x) / 0.26
        const bulge = Math.exp(-d * d) * smoothed.strength
        const lift = Math.max(0, 1 - smoothed.y + 0.06 - h)
        h += bulge * lift * 0.5 * fill
        h += bulge * 0.05 * Math.abs(u - 0.5) * 2

        const cx = (c + 0.5) * cell
        const outside = Math.max(keep.x0 - cx, cx - keep.x1, 0) / cell
        if (outside < 5) {
          const wobble = (0.5 + 2.2 * noise(c * 0.35, 3)) * cell
          const cap = keep.y1 + wobble - outside * cell * 1.3
          h = Math.min(h, (height - cap) / height)
        }
        return h
      }

      function hidesForQuietZone(cx: number, cy: number, c: number, r: number) {
        if (!quietZone) {
          return false
        }
        const dx = Math.max(keep.x0 - cx, cx - keep.x1, 0)
        const dy = Math.max(keep.y0 - cy, cy - keep.y1, 0)
        const distance = Math.hypot(dx, dy) / cell
        if (distance === 0) {
          return true
        }
        return (
          distance < 2.5 &&
          hash(c * 3 + 5, r * 7 + 1) < (1 - distance / 2.5) * 0.85
        )
      }

      function hidesForDepth(
        depth: number,
        fill: number,
        c: number,
        r: number,
      ) {
        if (depth < 0) {
          return (
            fill < 0.15 ||
            depth < -4.5 ||
            hash(c * 3 + 11, r * 5 + 2) > 0.55 + depth * 0.12
          )
        }
        return depth < 1 && hash(c * 7 + 3, r * 5 + 1) < 0.22
      }

      function drawGrid() {
        ctx!.strokeStyle = gridColor
        ctx!.lineWidth = 1
        ctx!.beginPath()
        for (let c = 0; c <= cols; c++) {
          const x = Math.round(c * cell) + 0.5
          ctx!.moveTo(x, 0)
          ctx!.lineTo(x, height)
        }
        ctx!.stroke()
      }

      function draw(now: number) {
        const dt = Math.min(0.05, (now - previous) / 1000)
        previous = now
        const seconds = (now - startedAt) / 1000
        const introFill = introProgress()
        const ease = 1 - Math.exp(-dt * surfaceRate)

        smoothed.x += (pointer.x / Math.max(width, 1) - smoothed.x) * ease
        smoothed.y += (pointer.y / Math.max(height, 1) - smoothed.y) * ease
        smoothed.strength +=
          ((pointer.inside ? 1 : 0) - smoothed.strength) * ease

        advanceLevels(dt, introFill)
        advanceTrail(dt)
        paintTrailStrength()

        ctx!.fillStyle = ground
        ctx!.fillRect(0, 0, width, height)
        drawGrid()

        const gap = Math.max(1, cell * gapRatio)
        const size = cell - gap
        const radius = Math.max(1, cell * radiusRatio)

        for (let c = 0; c < cols; c++) {
          const fill = smoothstep(level[c])
          const target = columnHeight(c, seconds, fill)
          surface[c] += (target - surface[c]) * (reduce ? 1 : ease)
          const surfacePx = height - surface[c] * height
          const cx = (c + 0.5) * cell

          for (let r = 0; r < rows; r++) {
            const y = height - (r + 1) * cell + gap / 2
            if (y + size < surfacePx - cell * 5) {
              break
            }
            const depth = (y - surfacePx) / cell
            const cy = y + size / 2

            if (
              hidesForQuietZone(cx, cy, c, r) ||
              hidesForDepth(depth, fill, c, r)
            ) {
              continue
            }

            const band = Math.min(
              tones.length - 1,
              Math.floor((((r + 0.5) * cell) / height) * tones.length),
            )
            const strength = trailStrength[r * cols + c]
            ctx!.fillStyle =
              palette[band][
                Math.round(Math.min(trailPeak, strength) * toneSteps)
              ]

            ctx!.beginPath()
            ctx!.roundRect(c * cell + gap / 2, y, size, size, radius)
            ctx!.fill()
          }
        }
      }

      function loop(now: number) {
        draw(now)
        raf = window.requestAnimationFrame(loop)
      }

      const running = () => onScreen && !document.hidden

      function start() {
        if (reduce || raf || !running()) {
          return
        }
        previous = performance.now()
        raf = window.requestAnimationFrame(loop)
      }

      function stop() {
        window.cancelAnimationFrame(raf)
        raf = 0
      }

      function onVisibilityChange() {
        if (running()) {
          start()
        } else {
          stop()
        }
      }

      function trackPointer(event: PointerEvent) {
        const rect = panel!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        if (pointer.inside) {
          pointer.speed = Math.min(
            1.5,
            pointer.speed + Math.hypot(x - pointer.x, y - pointer.y) / 260,
          )
        }
        pointer.inside = true
        pointer.x = x
        pointer.y = y
      }

      function releasePointer() {
        pointer.inside = false
        pointer.speed = 0
      }

      const passive = { passive: true } as const
      panel.addEventListener('pointermove', trackPointer, passive)
      panel.addEventListener('pointerdown', trackPointer, passive)
      panel.addEventListener('pointerleave', releasePointer, passive)
      panel.addEventListener('pointercancel', releasePointer, passive)

      function handleResize() {
        resize()
        if (!raf) {
          draw(performance.now())
        }
      }

      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(panel)

      const viewportObserver = new IntersectionObserver(
        function onViewportChange([entry]) {
          onScreen = entry?.isIntersecting ?? true
          onVisibilityChange()
        },
        { threshold: 0 },
      )
      viewportObserver.observe(panel)
      document.addEventListener('visibilitychange', onVisibilityChange)

      resize()
      if (reduce) {
        draw(startedAt)
      } else {
        start()
      }

      return function cleanup() {
        stop()
        resizeObserver.disconnect()
        viewportObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        panel.removeEventListener('pointermove', trackPointer)
        panel.removeEventListener('pointerdown', trackPointer)
        panel.removeEventListener('pointerleave', releasePointer)
        panel.removeEventListener('pointercancel', releasePointer)
      }
    },
    [cellSize, edgeHeight, floorHeight, quietZone],
  )

  return (
    <div className={`overflow-hidden bg-white ${className}`} ref={panelRef}>
      <canvas
        aria-hidden
        className="absolute inset-0 block size-full"
        ref={canvasRef}
      />
    </div>
  )
}
