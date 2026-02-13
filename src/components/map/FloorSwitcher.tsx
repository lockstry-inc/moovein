import { useFacilityStore } from '../../stores/facilityStore'

export default function FloorSwitcher() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const switchFloor = useFacilityStore(s => s.switchFloor)

  if (!facility || facility.floors.length < 2) return null

  return (
    <div
      className="flex bg-surface border border-border rounded-[14px]"
      style={{ gap: 4, padding: 5 }}
    >
      {facility.floors.map(floor => {
        const active = floor.id === currentFloorId
        const vacantCount = floor.units.filter(u => !u.occ).length
        return (
          <button
            key={floor.id}
            onClick={() => switchFloor(floor.id)}
            className={`rounded-[10px] text-[13px] font-semibold transition-all duration-200 cursor-pointer border-none ${
              active
                ? 'bg-accent-bg text-accent shadow-[0_0_12px_rgba(143,0,0,0.15)]'
                : 'bg-transparent text-text-sec hover:text-text hover:bg-surface-2'
            }`}
            style={{ padding: '10px 20px' }}
          >
            {floor.name}
            <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.6 }}>{vacantCount}</span>
          </button>
        )
      })}
    </div>
  )
}
