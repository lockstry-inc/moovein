import { useFacilityStore } from '../../stores/facilityStore'

export default function FloorSwitcher() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const switchFloor = useFacilityStore(s => s.switchFloor)

  if (!facility || facility.floors.length < 2) return null

  return (
    <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 flex gap-1 bg-surface border border-border rounded-[12px] p-1 z-90 md:bottom-[22px]">
      {facility.floors.map(floor => {
        const active = floor.id === currentFloorId
        const vacantCount = floor.units.filter(u => !u.occ).length
        return (
          <button
            key={floor.id}
            onClick={() => switchFloor(floor.id)}
            className={`px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all duration-200 cursor-pointer border-none ${
              active
                ? 'bg-accent-bg text-accent shadow-[0_0_12px_rgba(45,212,160,0.15)]'
                : 'bg-transparent text-text-sec hover:text-text hover:bg-surface-2'
            }`}
          >
            {floor.name}
            <span className="ml-1.5 text-[10px] opacity-70">{vacantCount}</span>
          </button>
        )
      })}
    </div>
  )
}
