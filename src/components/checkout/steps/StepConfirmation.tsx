import type { UnitData } from '../../../types/facility'
import { UNIT_TYPES } from '../../../data/unitTypes'
import { useCheckoutStore } from '../../../stores/checkoutStore'
import { useFacilityStore } from '../../../stores/facilityStore'

interface Props {
  unit: UnitData
}

export default function StepConfirmation({ unit }: Props) {
  const type = UNIT_TYPES[unit.type]
  const selectedDate = useCheckoutStore(s => s.selectedDate)
  const reset = useCheckoutStore(s => s.reset)
  const goToMap = useFacilityStore(s => s.goToMap)

  const handleBackToMap = () => {
    reset()
    goToMap()
  }

  return (
    <div className="text-center" style={{ padding: '32px 20px 24px' }}>
      <div className="text-[48px] mb-[16px]">{'\uD83C\uDF89'}</div>
      <div className="font-['Playfair_Display',serif] text-[24px] font-bold text-white mb-[8px]">Space Reserved!</div>
      <div className="text-[13px] text-text-sec leading-[1.5] mb-6">
        Your unit is ready. Here&apos;s everything you need for move-in day.
      </div>

      {/* Details */}
      <div className="bg-bg border border-border rounded-[14px] text-left mb-5" style={{ padding: '18px 16px' }}>
        <Row label="Unit" value={`${unit.id} \u00b7 ${type.name}`} />
        <Row label="Move-in" value={selectedDate || '\u2014'} />
        <Row label="Access Code" value="7291" />
        <Row label="Monthly" value={`$${type.price}/mo`} />
      </div>

      {/* Actions */}
      <div className="flex gap-[10px]">
        <button
          onClick={handleBackToMap}
          className="flex-1 bg-transparent border-[1.5px] border-border rounded-[10px] text-text text-[12px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-[5px] hover:border-border-light hover:bg-surface-2"
          style={{ padding: '12px 0' }}
        >
          {'\uD83D\uDDFA\uFE0F'} Back to Map
        </button>
        <button
          className="flex-1 bg-transparent border-[1.5px] border-border rounded-[10px] text-text text-[12px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-[5px] hover:border-border-light hover:bg-surface-2"
          style={{ padding: '12px 0' }}
        >
          {'\uD83D\uDCF1'} Download App
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-[7px] text-[12px] border-b border-[rgba(38,40,48,0.5)] last:border-b-0">
      <span className="text-text-sec">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}
