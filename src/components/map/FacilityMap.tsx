import { useRef, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import { useMapControls } from '../../hooks/useMapControls'
import FacilityFloor from './FacilityFloor'

export default function FacilityMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<HTMLDivElement>(null)
  const { onMouseDown, onMouseMove, onMouseUp, onWheel } = useMapControls(containerRef)

  // Only subscribe to data that triggers React re-renders (not viewport)
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const floor = facility?.floors.find(f => f.id === currentFloorId)

  // Prevent default wheel on the container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // rAF-based smooth viewport interpolation — replaces CSS transitions
  // Lerp speed adapts to interaction type: instant for drag, smooth for zoom
  useEffect(() => {
    const el = transformRef.current
    if (!el) return

    // Visual state (what's actually rendered)
    const initial = useFacilityStore.getState()
    const vis = { scale: initial.scale, panX: initial.panX, panY: initial.panY }
    el.style.transform = `translate(${vis.panX}px, ${vis.panY}px) scale(${vis.scale})`

    let rafId: number | null = null
    let lastTime = 0

    const animate = (time: number) => {
      const { scale, panX, panY, smoothTransition } = useFacilityStore.getState()

      // Frame-rate independent lerp: normalize to 60fps frame time
      const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1
      lastTime = time

      // Lerp speed based on interaction type
      let baseLerp: number
      if (smoothTransition === 0) baseLerp = 1.0       // drag: instant
      else if (smoothTransition <= 150) baseLerp = 0.18 // wheel: snappy smooth
      else baseLerp = 0.09                              // button/reset: elegant glide

      const lerp = Math.min(1, 1 - Math.pow(1 - baseLerp, dt))

      vis.scale += (scale - vis.scale) * lerp
      vis.panX += (panX - vis.panX) * lerp
      vis.panY += (panY - vis.panY) * lerp

      el.style.transform = `translate(${vis.panX}px, ${vis.panY}px) scale(${vis.scale})`

      // Check if settled (close enough to snap)
      const settled =
        Math.abs(scale - vis.scale) < 0.00005 &&
        Math.abs(panX - vis.panX) < 0.01 &&
        Math.abs(panY - vis.panY) < 0.01

      if (settled) {
        vis.scale = scale
        vis.panX = panX
        vis.panY = panY
        el.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`
        rafId = null
      } else {
        rafId = requestAnimationFrame(animate)
      }
    }

    const startAnimation = () => {
      if (!rafId) {
        lastTime = 0
        rafId = requestAnimationFrame(animate)
      }
    }

    // Subscribe to store viewport changes (bypasses React render cycle)
    const unsub = useFacilityStore.subscribe(
      (state, prev) => {
        if (state.scale !== prev.scale || state.panX !== prev.panX || state.panY !== prev.panY) {
          startAnimation()
        }
      }
    )

    return () => {
      unsub()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed top-[58px] left-0 right-0 bottom-0 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(45,212,160,0.015) 0%, transparent 60%), var(--color-bg)' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        ref={transformRef}
        className="absolute will-change-transform origin-[0_0]"
      >
        {floor && <FacilityFloor floor={floor} />}
      </div>
    </div>
  )
}
