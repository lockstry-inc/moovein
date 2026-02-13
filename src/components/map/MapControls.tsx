import { useFacilityStore } from '../../stores/facilityStore'

export default function MapControls() {
  const zoomBy = useFacilityStore(s => s.zoomBy)
  const resetView = useFacilityStore(s => s.resetView)

  return (
    <div className="fixed bottom-[22px] right-[22px] flex gap-[5px] z-90">
      <button
        onClick={() => zoomBy(0.2)}
        className="bg-surface border border-border rounded-[12px] text-text-sec text-[18px] font-['DM_Sans',sans-serif] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
        style={{ width: 44, height: 44 }}
      >
        +
      </button>
      <button
        onClick={() => zoomBy(-0.2)}
        className="bg-surface border border-border rounded-[12px] text-text-sec text-[18px] font-['DM_Sans',sans-serif] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
        style={{ width: 44, height: 44 }}
      >
        &minus;
      </button>
      <button
        onClick={resetView}
        className="bg-surface border border-border rounded-[12px] text-text-sec text-[11px] font-semibold font-['DM_Sans',sans-serif] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-2 hover:text-text"
        style={{ height: 44, padding: '0 16px' }}
      >
        Reset
      </button>
    </div>
  )
}
