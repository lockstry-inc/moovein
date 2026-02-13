import { useRef, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import { useMapControls } from '../../hooks/useMapControls'
import FacilityFloor from './FacilityFloor'

export default function FacilityMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { onMouseDown, onMouseMove, onMouseUp, onWheel } = useMapControls(containerRef)
  const scale = useFacilityStore(s => s.scale)
  const panX = useFacilityStore(s => s.panX)
  const panY = useFacilityStore(s => s.panY)
  const smooth = useFacilityStore(s => s.smoothTransition)
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
        className="absolute origin-center will-change-transform"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transition: smooth ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        onTransitionEnd={() => useFacilityStore.setState({ smoothTransition: false })}
      >
        {floor && <FacilityFloor floor={floor} />}
      </div>
    </div>
  )
}
