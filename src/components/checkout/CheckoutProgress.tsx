import { useCheckoutStore } from '../../stores/checkoutStore'

const STEP_LABELS = ['Unit Details', 'Add-ons', 'Lease Agreement', 'Identity', 'Move-in', 'Payment', 'Confirmed']
const TOTAL_STEPS = 7

export default function CheckoutProgress() {
  const step = useCheckoutStore(s => s.step)

  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1
        const isDone = n < step
        const isCurrent = n === step
        return (
          <div
            key={n}
            className={`rounded-full transition-all duration-300 ${
              isDone
                ? 'w-2 h-2 bg-accent'
                : isCurrent
                  ? 'w-[10px] h-[10px] bg-accent shadow-[0_0_8px_rgba(143,0,0,0.4)]'
                  : 'w-2 h-2 bg-surface-3'
            }`}
          />
        )
      })}
      <span className="text-[10px] font-semibold text-text-dim ml-[6px] tracking-[0.3px]">
        {STEP_LABELS[step - 1]}
      </span>
    </div>
  )
}
