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
        <button
          className="w-full rounded-[10px] border-none cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-200 hover:-translate-y-[1px] bg-white text-black"
          style={{ padding: '13px 0' }}
        >
          <svg viewBox="0 0 17 20" width="14" height="17" fill="black">
            <path d="M14.06 10.58c-.03-2.72 2.22-4.03 2.32-4.09-1.26-1.85-3.23-2.1-3.93-2.13-1.67-.17-3.27.99-4.12.99-.85 0-2.17-.97-3.57-.94-1.84.03-3.53 1.07-4.48 2.72-1.91 3.31-.49 8.22 1.37 10.91.91 1.32 2 2.8 3.43 2.75 1.38-.05 1.9-.89 3.56-.89s2.13.89 3.58.86c1.48-.03 2.39-1.34 3.29-2.67 1.04-1.53 1.46-3.01 1.49-3.09-.03-.01-2.86-1.1-2.89-4.36l-.05-.06zM11.35 2.95C12.1 2.05 12.61.82 12.47 0c-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 1.99-1.08 3.17 1.15.09 2.32-.58 2.98-1.77z"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>Pay</span>
        </button>
        <button
          className="w-full rounded-[10px] cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-200 hover:-translate-y-[1px] bg-[#1a1a1a] text-white border border-[#333]"
          style={{ padding: '13px 0' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.78.42 3.46 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Pay</span>
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
        <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200 mb-2 tracking-[1.5px]" style={{ padding: '11px 13px' }} placeholder="Card number" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" style={{ padding: '11px 13px' }} placeholder="MM / YY" />
          <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" style={{ padding: '11px 13px' }} placeholder="CVC" />
        </div>
        <input className="bg-surface-2 border-[1.5px] border-border rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none w-full placeholder:text-text-dim focus:border-accent transition-[border-color] duration-200" style={{ padding: '11px 13px' }} placeholder="Name on card" />
      </div>

      {/* Order summary */}
      <OrderSummary unitPrice={type.price} unitLabel={`${type.name} \u00b7 ${type.dims}`} />

      {/* Agreements */}
      <div className="mt-[18px]" />
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
