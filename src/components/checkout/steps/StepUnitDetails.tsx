import type { UnitData } from '../../../types/facility'
import { UNIT_TYPES } from '../../../data/unitTypes'
import { useFacilityStore } from '../../../stores/facilityStore'

interface Props {
  unit: UnitData
}

export default function StepUnitDetails({ unit }: Props) {
  const type = UNIT_TYPES[unit.type]
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const facility = useFacilityStore(s => s.currentFacility)
  const floor = facility?.floors.find(f => f.id === currentFloorId)

  const features = [
    { icon: '\u2744\uFE0F', name: 'Climate Control', val: unit.climate ? 'Yes' : 'No', on: !!unit.climate },
    { icon: unit.driveup ? '\uD83D\uDE97' : unit.ext ? '\uD83C\uDFE0' : '\uD83D\uDEAA', name: 'Access Type', val: unit.driveup ? 'Drive-up' : unit.ext ? 'Exterior' : 'Interior', on: true },
    { icon: '\uD83D\uDCD0', name: 'Floor', val: floor?.name || 'Ground', on: true },
    { icon: '\uD83D\uDCCF', name: 'Ceiling', val: type.ceiling, on: true },
    { icon: '\uD83D\uDD12', name: 'Smart Lock', val: unit.smartlock ? 'Ready' : 'Not included', on: !!unit.smartlock },
    { icon: '\u26A1', name: 'Power Outlet', val: unit.power ? 'Yes' : 'No', on: !!unit.power },
    { icon: '\uD83D\uDEA8', name: 'Unit Alarm', val: unit.alarm ? 'Installed' : 'No', on: !!unit.alarm },
  ]

  return (
    <div className="p-[22px_20px]">
      <div className="text-[11px] font-bold text-text-dim tracking-[2px] uppercase mb-1">UNIT {unit.id}</div>
      <div className="font-['Playfair_Display',serif] text-[22px] font-bold text-white mb-[3px]">{type.name}</div>
      <div className="text-[14px] text-text-sec mb-[18px]">{type.dims} &middot; {type.sqft}</div>

      {/* Features */}
      <div className="mb-[18px]">
        {features.map((f, i) => (
          <div key={i} className="flex items-center justify-between py-[10px] border-b border-[rgba(38,40,48,0.7)] last:border-b-0">
            <div className="flex items-center gap-[9px]">
              <div className="w-7 h-7 bg-surface-2 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">{f.icon}</div>
              <span className="text-[13px] font-medium text-text">{f.name}</span>
            </div>
            <span className={`text-[12px] font-semibold ${f.on ? 'text-accent' : 'text-text-sec'}`}>{f.val}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-bg border border-border rounded-[14px] p-4 mb-3">
        <div className="text-[12px] text-text-sec mb-[3px]">Monthly rate</div>
        <div className="text-[26px] font-bold text-white tracking-[-0.5px]">
          ${type.price}<span className="text-[13px] text-text-sec font-normal"> /mo</span>
        </div>
        <div className="text-[11px] text-text-dim mt-[6px] leading-[1.4]">
          No deposit &middot; Cancel anytime &middot; First month prorated
        </div>
      </div>
    </div>
  )
}
