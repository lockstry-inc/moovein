import { useCheckoutStore } from '../../../stores/checkoutStore'
import { LEASE_SECTIONS } from '../../../data/leaseTerms'
import SignatureCanvas from '../../shared/SignatureCanvas'

export default function StepLease() {
  const leaseAgreed = useCheckoutStore(s => s.leaseAgreed)
  const leaseBindingAgreed = useCheckoutStore(s => s.leaseBindingAgreed)
  const toggleCheckbox = useCheckoutStore(s => s.toggleCheckbox)
  const setSignature = useCheckoutStore(s => s.setSignature)

  return (
    <div className="p-[22px_20px]">
      <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[10px]">Review & Sign Lease</div>

      {/* Lease text */}
      <div className="bg-bg border border-border rounded-[14px] p-4 mb-[14px] max-h-[260px] overflow-y-auto">
        <div className="text-[13px] font-bold text-white mb-[10px]">Self-Storage Rental Agreement</div>
        <div className="text-[11px] text-text-sec leading-[1.7]">
          {LEASE_SECTIONS.map(s => (
            <p key={s.number} className="mb-2 last:mb-0">
              <strong className="text-text">{s.number}. {s.title}.</strong> {s.text}
            </p>
          ))}
        </div>
      </div>

      {/* Signature */}
      <div className="bg-surface-2 border border-border rounded-[10px] p-[14px] mb-[14px]">
        <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-2">Your Signature</div>
        <SignatureCanvas onSign={(url) => setSignature(url)} />
        <div className="text-[10px] text-text-dim mt-[6px]">Draw your signature above to sign the lease agreement</div>
      </div>

      {/* Checkboxes */}
      <Checkbox checked={leaseAgreed} onToggle={() => toggleCheckbox('leaseAgreed')}>
        I have read and agree to the Rental Agreement terms above
      </Checkbox>
      <Checkbox checked={leaseBindingAgreed} onToggle={() => toggleCheckbox('leaseBindingAgreed')}>
        I understand this creates a binding month-to-month rental obligation
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
