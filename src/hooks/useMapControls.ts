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
    const { scale } = useFacilityStore.getState()
    const next = Math.max(0.15, Math.min(2.5, scale + (e.deltaY > 0 ? -1 : 1) * 0.08))
    useFacilityStore.setState({ scale: next, smoothTransition: false })
  }, [])

  const centerMap = useCallback(() => {
    useFacilityStore.getState().resetView()
  }, [])

  return { onMouseDown, onMouseMove, onMouseUp, onWheel, centerMap, isDragging: () => dragState.current.dragging }
}
