import { useFacilityStore } from '../../stores/facilityStore'

export default function MapLegend() {
  const filterSidebarOpen = useFacilityStore(s => s.filterSidebarOpen)

  return (
    <div
      className="fixed top-[76px] flex gap-4 z-90 transition-[left] duration-350"
      style={{ left: filterSidebarOpen ? 264 : 70 }}
    >
      <div className="flex items-center gap-[6px] text-[12px] font-semibold text-text-sec">
        <div className="w-[11px] h-[11px] rounded-[3px] bg-accent" />
        Vacant
      </div>
      <div className="flex items-center gap-[6px] text-[12px] font-semibold text-text-sec">
        <div className="w-[11px] h-[11px] rounded-[3px] bg-occ opacity-70" />
        Occupied
      </div>
      <div className="flex items-center gap-[6px] text-[12px] font-semibold text-text-sec">
        <div className="w-[11px] h-[11px] rounded-[3px] bg-sel" />
        Selected
      </div>
    </div>
  )
}
