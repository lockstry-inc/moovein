import { useFacilityStore } from '../../stores/facilityStore'

export default function MapStats() {
  const filterSidebarOpen = useFacilityStore(s => s.filterSidebarOpen)
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const activeFilters = useFacilityStore(s => s.activeFilters)

  const floor = facility?.floors.find(f => f.id === currentFloorId)
  if (!floor) return null

  let vacant: number, occupied: number
  if (activeFilters.size > 0) {
    const filtered = floor.units.filter(u => activeFilters.has(u.type))
    vacant = filtered.filter(u => !u.occ).length
    occupied = filtered.filter(u => !!u.occ).length
  } else {
    vacant = floor.units.filter(u => !u.occ).length
    occupied = floor.units.filter(u => !!u.occ).length
  }

  return (
    <div
      className="fixed flex items-center bg-surface border border-border rounded-[14px] z-90 transition-all duration-350"
      style={{ left: 12, top: filterSidebarOpen ? 540 : 124, padding: '12px 20px', gap: 20 }}
    >
      <div className="flex flex-col gap-[2px]">
        <span className="text-[18px] font-bold text-accent">{vacant}</span>
        <span className="text-[10px] font-semibold text-text-dim tracking-[0.5px] uppercase">Vacant</span>
      </div>
      <div className="w-px h-7 bg-border" />
      <div className="flex flex-col gap-[2px]">
        <span className="text-[18px] font-bold text-occ">{occupied}</span>
        <span className="text-[10px] font-semibold text-text-dim tracking-[0.5px] uppercase">Occupied</span>
      </div>
    </div>
  )
}
