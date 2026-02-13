import { useCallback, useRef } from 'react'
import { useFacilityStore } from '../stores/facilityStore'

export function useMapControls(containerRef: React.RefObject<HTMLDivElement | null>) {
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.unit, .pnl, .pnl-bg, .fb, .ctrl, button')) return
    const { panX, panY } = useFacilityStore.getState()
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.dragging) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    useFacilityStore.getState().setViewport(
      useFacilityStore.getState().scale,
      dragState.current.startPanX + dx,
      dragState.current.startPanY + dy,
    )
  }, [])

  const onMouseUp = useCallback(() => {
    dragState.current.dragging = false
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    const { scale, panX, panY } = useFacilityStore.getState()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    // Normalize deltaY across browsers/devices (trackpad vs mouse wheel)
    const rawDelta = Math.abs(e.deltaY)
    const normalizedDelta = Math.min(rawDelta, 100) / 100
    // Gentle zoom: 2–6% per tick for smooth feel
    const strength = normalizedDelta * 0.06
    const factor = e.deltaY > 0 ? 1 - strength : 1 + strength
    const next = Math.max(0.05, Math.min(2.5, scale * factor))

    // Zoom toward cursor: keep the world point under the cursor fixed
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    const newPanX = cursorX - (cursorX - panX) * (next / scale)
    const newPanY = cursorY - (cursorY - panY) * (next / scale)

    useFacilityStore.setState({ scale: next, panX: newPanX, panY: newPanY, smoothTransition: false })
  }, [])

  const centerMap = useCallback(() => {
    useFacilityStore.getState().resetView()
  }, [])

  return { onMouseDown, onMouseMove, onMouseUp, onWheel, centerMap, isDragging: () => dragState.current.dragging }
}
