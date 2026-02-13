import { useFacilityStore } from '../../stores/facilityStore'

export default function MapLegend() {
  const filterSidebarOpen = useFacilityStore(s => s.filterSidebarOpen)

  return (
    <div
      className="fixed top-[76px] flex gap-[14px] z-90 transition-[left] duration-350"
      style={{ left: filterSidebarOpen ? 230 : 24 }}
    >
      <div className="flex items-center gap-[5px] text-[11px] font-semibold text-text-sec">
        <div className="w-[10px] h-[10px] rounded-[3px] bg-accent" />
        Vacant
      </div>
      <div className="flex items-center gap-[5px] text-[11px] font-semibold text-text-sec">
        <div className="w-[10px] h-[10px] rounded-[3px] bg-occ opacity-70" />
        Occupied
      </div>
      <div className="flex items-center gap-[5px] text-[11px] font-semibold text-text-sec">
        <div className="w-[10px] h-[10px] rounded-[3px] bg-sel" />
        Selected
      </div>
    </div>
  )
}
