import { useFacilityStore } from '../../stores/facilityStore'

export default function MapControls() {
  const zoomBy = useFacilityStore(s => s.zoomBy)
  const resetView = useFacilityStore(s => s.resetView)

  return (
    <div className="fixed bottom-[22px] right-[22px] flex gap-1 z-90">
      <button
        onClick={() => zoomBy(0.2)}
        className="w-10 h-10 bg-surface border border-border rounded-[10px] text-text-sec text-[18px] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
      >
        +
      </button>
      <button
        onClick={() => zoomBy(-0.2)}
        className="w-10 h-10 bg-surface border border-border rounded-[10px] text-text-sec text-[18px] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
      >
        &minus;
      </button>
      <button
        onClick={resetView}
        className="h-10 px-[13px] bg-surface border border-border rounded-[10px] text-text-sec text-[11px] font-semibold cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
      >
        Reset
      </button>
    </div>
  )
}
