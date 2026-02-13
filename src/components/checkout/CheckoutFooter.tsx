import { useCheckoutStore } from '../../stores/checkoutStore'
import type { UnitData } from '../../types/facility'

const BTN_LABELS = ['Reserve This Unit', 'Continue', 'Sign & Continue', 'Continue', 'Continue', 'Complete Reservation', '']

interface Props {
  unit: UnitData
}

export default function CheckoutFooter({ unit }: Props) {
  const step = useCheckoutStore(s => s.step)
  const nextStep = useCheckoutStore(s => s.nextStep)

  return (
    <div className="px-5 py-[14px] border-t border-border shrink-0">
      <button
        onClick={nextStep}
        className="w-full py-[14px] bg-accent text-bg border-none rounded-[10px] text-[14px] font-bold font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-200 hover:brightness-110 hover:-translate-y-[1px]"
      >
        {BTN_LABELS[step - 1]}
      </button>
    </div>
  )
}
