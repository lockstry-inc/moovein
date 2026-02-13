import { useCheckoutStore } from '../../../stores/checkoutStore'
import { UNIT_TYPES } from '../../../data/unitTypes'
import type { UnitData } from '../../../types/facility'
import OrderSummary from '../../shared/OrderSummary'

interface Props {
  unit: UnitData
}

export default function StepPayment({ unit }: Props) {
  const paymentAgreed = useCheckoutStore(s => s.paymentAgreed)
  const recurringAgreed = useCheckoutStore(s => s.recurringAgreed)
  const rulesAgreed = useCheckoutStore(s => s.rulesAgreed)
  const toggleCheckbox = useCheckoutStore(s => s.toggleCheckbox)
  const type = UNIT_TYPES[unit.type]

  return (
    <div style={{ padding: '22px 20px' }}>
      <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[10px]">Payment</div>

      {/* Express pay */}
      <div className="flex flex-col gap-[7px] mb-[14px]">
        <button className="w-full py-[13px] rounded-[10px] border-none text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[7px] transition-all duration-200 hover:-translate-y-[1px] bg-white text-black">
           Pay
        </button>
        <button className="w-full py-[13px] rounded-[10px] text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[7px] transition-all duration-200 hover:-translate-y-[1px] bg-[#1a1a1a] text-white border border-[#333]">
          Google Pay
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-[14px]">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-text-dim font-semibold tracking-[0.5px]">OR PAY WITH CARD</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Card form */}
      <div className="mb-[14px]">
        <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] py-[11px] px-[13px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200 mb-2 tracking-[1.5px]" placeholder="Card number" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] py-[11px] px-[13px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" placeholder="MM / YY" />
          <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] py-[11px] px-[13px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" placeholder="CVC" />
        </div>
        <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] py-[11px] px-[13px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" placeholder="Name on card" />
      </div>

      {/* Order summary */}
      <OrderSummary unitPrice={type.price} unitLabel={`${type.name} \u00b7 ${type.dims}`} />

      {/* Agreements */}
      <Checkbox checked={paymentAgreed} onToggle={() => toggleCheckbox('paymentAgreed')}>
        I agree to the Rental Agreement and Terms of Service
      </Checkbox>
      <Checkbox checked={recurringAgreed} onToggle={() => toggleCheckbox('recurringAgreed')}>
        I authorize recurring monthly charges until cancellation
      </Checkbox>
      <Checkbox checked={rulesAgreed} onToggle={() => toggleCheckbox('rulesAgreed')}>
        I acknowledge the facility rules and insurance terms
      </Checkbox>
    </div>
  )
}

function Checkbox({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onToggle} className="flex items-start gap-[9px] mb-[10px] cursor-pointer">
      <div className={`w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center text-[10px] transition-all duration-200 mt-[1px] border-[1.5px] ${
        checked ? 'bg-accent border-accent text-bg' : 'bg-surface-2 border-border text-transparent'
      }`}>
        &#10003;
      </div>
      <span className="text-[11px] text-text-sec leading-[1.4]">{children}</span>
    </div>
  )
}
