import { useCheckoutStore } from '../../stores/checkoutStore'
import type { UnitData } from '../../types/facility'

const BTN_LABELS = ['Reserve This Unit', 'Continue', 'Sign & Continue', 'Continue', 'Continue', 'Complete Reservation', '']

interface Props {
  unit: UnitData
}

export default function CheckoutFooter({ unit }: Props) {
  const step = useCheckoutStore(s => s.step)
  const nextStep = useCheckoutStore(s => s.nextStep)
  const prevStep = useCheckoutStore(s => s.prevStep)

  return (
    <div className="border-t border-border shrink-0" style={{ padding: '14px 20px' }}>
      <div className="flex gap-[10px]">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="bg-surface-2 border-[1.5px] border-border text-text-sec rounded-[10px] text-[14px] font-semibold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-200 hover:bg-surface-3 hover:text-text hover:border-border-light"
            style={{ padding: '14px 20px' }}
          >
            Back
          </button>
        )}
        <button
          onClick={nextStep}
          className="flex-1 bg-accent text-bg border-none rounded-[10px] text-[14px] font-bold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-[1px]"
          style={{ padding: '14px 0' }}
        >
          {BTN_LABELS[step - 1]}
        </button>
      </div>
    </div>
  )
}
