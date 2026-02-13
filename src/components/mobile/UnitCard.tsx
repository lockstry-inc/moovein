import type { UnitData } from '../../types/facility'
import { UNIT_TYPES } from '../../data/unitTypes'
import { getUnitFeatureList } from '../../data/features'
import { useFacilityStore } from '../../stores/facilityStore'

interface Props {
  unit: UnitData
}

export default function UnitCard({ unit }: Props) {
  const selectUnit = useFacilityStore(s => s.selectUnit)
  const type = UNIT_TYPES[unit.type]
  const feats = getUnitFeatureList(unit)

  return (
    <div
      onClick={() => selectUnit(unit.id)}
      className="p-4 bg-surface border border-border rounded-[12px] cursor-pointer transition-all duration-200 active:scale-[0.98] hover:border-border-light"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[10px] font-bold text-text-dim tracking-[1px] uppercase">Unit {unit.id}</div>
          <div className="font-['Playfair_Display',serif] text-[16px] font-bold text-text">{type.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[18px] font-bold text-accent">${type.price}</div>
          <div className="text-[10px] text-text-sec">/mo</div>
        </div>
      </div>
      <div className="text-[12px] text-text-sec mb-2">{type.dims} &middot; {type.sqft}</div>
      <div className="flex flex-wrap gap-[6px]">
        {feats.map(f => (
          <span key={f.key} className="text-[10px] text-text-sec bg-surface-2 px-2 py-1 rounded-[6px] font-medium">
            {f.icon} {f.label}
          </span>
        ))}
      </div>
    </div>
  )
}
