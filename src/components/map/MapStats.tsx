import { useFacilityStore } from '../../stores/facilityStore'

export default function MapStats() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const switchFloor = useFacilityStore(s => s.switchFloor)
  const activeFilters = useFacilityStore(s => s.activeFilters)

  const floor = facility?.floors.find(f => f.id === currentFloorId)
  if (!floor) return null

  const hasMultipleFloors = (facility?.floors.length ?? 0) > 1

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
      className="fixed bottom-[22px] left-[12px] bg-surface border border-border rounded-[14px] z-90"
    >
      {/* Floor tabs */}
      {hasMultipleFloors && (
        <div className="flex border-b border-border" style={{ gap: 4, padding: 5 }}>
          {facility!.floors.map(f => {
            const active = f.id === currentFloorId
            return (
              <button
                key={f.id}
                onClick={() => switchFloor(f.id)}
                className={`flex-1 rounded-[10px] text-[12px] font-semibold transition-all duration-200 cursor-pointer border-none ${
                  active
                    ? 'bg-accent-bg text-accent shadow-[0_0_12px_rgba(45,212,160,0.15)]'
                    : 'bg-transparent text-text-sec hover:text-text hover:bg-surface-2'
                }`}
                style={{ padding: '8px 16px' }}
              >
                {f.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center" style={{ padding: '10px 20px', gap: 20 }}>
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
    </div>
  )
}
