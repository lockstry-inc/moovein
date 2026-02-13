import { useFacilityStore } from '../../stores/facilityStore'

export default function MapStats() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const switchFloor = useFacilityStore(s => s.switchFloor)
  const activeFilters = useFacilityStore(s => s.activeFilters)

  const floor = facility?.floors.find(f => f.id === currentFloorId)
  if (!floor) return null

  const floors = facility?.floors ?? []
  const hasMultipleFloors = floors.length > 1

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
    <div className="fixed bottom-[22px] left-[12px] bg-surface border border-border rounded-[14px] z-90">
      <div className="flex">
        {/* Left column: Floor 1 tab + Vacant */}
        <div className="flex flex-col items-center flex-1">
          {hasMultipleFloors && (
            <div className="w-full border-b border-border" style={{ padding: 5 }}>
              <button
                onClick={() => switchFloor(floors[0].id)}
                className={`w-full rounded-[10px] text-[12px] font-semibold transition-all duration-200 cursor-pointer border-none ${
                  floors[0].id === currentFloorId
                    ? 'bg-accent-bg text-accent shadow-[0_0_12px_rgba(45,212,160,0.15)]'
                    : 'bg-transparent text-text-sec hover:text-text hover:bg-surface-2'
                }`}
                style={{ padding: '8px 16px' }}
              >
                {floors[0].name}
              </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-[2px]" style={{ padding: '10px 20px' }}>
            <span className="text-[18px] font-bold text-accent">{vacant}</span>
            <span className="text-[10px] font-semibold text-text-dim tracking-[0.5px] uppercase">Vacant</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border" />

        {/* Right column: Floor 2 tab + Occupied */}
        <div className="flex flex-col items-center flex-1">
          {hasMultipleFloors && (
            <div className="w-full border-b border-border" style={{ padding: 5 }}>
              <button
                onClick={() => switchFloor(floors[1].id)}
                className={`w-full rounded-[10px] text-[12px] font-semibold transition-all duration-200 cursor-pointer border-none ${
                  floors[1].id === currentFloorId
                    ? 'bg-accent-bg text-accent shadow-[0_0_12px_rgba(45,212,160,0.15)]'
                    : 'bg-transparent text-text-sec hover:text-text hover:bg-surface-2'
                }`}
                style={{ padding: '8px 16px' }}
              >
                {floors[1].name}
              </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-[2px]" style={{ padding: '10px 20px' }}>
            <span className="text-[18px] font-bold text-occ">{occupied}</span>
            <span className="text-[10px] font-semibold text-text-dim tracking-[0.5px] uppercase">Occupied</span>
          </div>
        </div>
      </div>
    </div>
  )
}
