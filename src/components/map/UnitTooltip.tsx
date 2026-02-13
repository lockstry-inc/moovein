import { useFacilityStore } from '../../stores/facilityStore'
import { UNIT_TYPES } from '../../data/unitTypes'
import { getUnitFeatureList } from '../../data/features'

export default function UnitTooltip() {
  const tooltip = useFacilityStore(s => s.tooltip)
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)

  if (!tooltip.visible || !facility) return null

  const floor = facility.floors.find(f => f.id === currentFloorId)
  const unit = floor?.units.find(u => u.id === tooltip.unitId)
  if (!unit) return null

  const type = UNIT_TYPES[unit.type]
  const feats = getUnitFeatureList(unit)
  const isOcc = !!unit.occ

  return (
    <div
      className="fixed pointer-events-none z-[600] whitespace-nowrap"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        opacity: 1,
        transition: 'opacity 0.12s',
      }}
    >
      <div
        className="bg-[rgba(14,16,20,0.96)] backdrop-blur-[16px] border border-border-light rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{ padding: '12px 16px' }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isOcc ? 'bg-occ' : 'bg-accent shadow-[0_0_6px_var(--color-accent)]'}`} />
          <span className="text-[13px] font-bold text-white">{unit.id}</span>
        </div>
        <div className="text-[12px] text-text-sec mt-1">{type.name} &middot; {type.dims}</div>
        <div className="flex gap-2 mt-[5px] text-[11px] text-text-sec">
          {feats.map(f => <span key={f.key}>{f.icon} {f.label}</span>)}
        </div>
        {isOcc ? (
          <div className="text-[12px] font-semibold text-occ mt-[5px]">Occupied</div>
        ) : (
          <div className="text-[14px] font-bold text-accent mt-[5px]">${type.price}/mo</div>
        )}
      </div>
    </div>
  )
}
