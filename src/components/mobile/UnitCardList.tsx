import { useFacilityStore } from '../../stores/facilityStore'
import { UNIT_TYPES } from '../../data/unitTypes'
import UnitCard from './UnitCard'

export default function UnitCardList() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const activeFilters = useFacilityStore(s => s.activeFilters)

  const floor = facility?.floors.find(f => f.id === currentFloorId)
  if (!floor) return <div className="pt-[120px] text-center text-text-dim text-[13px]">Loading...</div>

  let units = floor.units.filter(u => !u.occ)
  if (activeFilters.size > 0) {
    units = units.filter(u => activeFilters.has(u.type))
  }
  // Sort by price ascending
  units.sort((a, b) => UNIT_TYPES[a.type].price - UNIT_TYPES[b.type].price)

  return (
    <div className="fixed top-[58px] left-0 right-0 bottom-0 overflow-y-auto pb-[80px] pt-[60px] px-3" style={{ background: 'var(--color-bg)' }}>
      <div className="text-[11px] font-semibold text-text-dim tracking-[0.5px] uppercase mb-3">
        {units.length} units available
      </div>
      <div className="flex flex-col gap-2">
        {units.map(unit => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>
      {units.length === 0 && (
        <div className="text-center py-12 text-text-dim text-[13px]">
          No units match your filters. Try adjusting your selection.
        </div>
      )}
    </div>
  )
}
