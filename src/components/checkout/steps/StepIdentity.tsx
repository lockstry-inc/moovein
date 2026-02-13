import { useState } from 'react'
import { useCheckoutStore } from '../../../stores/checkoutStore'

export default function StepIdentity() {
  const [showForm, setShowForm] = useState(false)
  const idVerified = useCheckoutStore(s => s.idVerified)
  const setIdVerified = useCheckoutStore(s => s.setIdVerified)
  const personalInfo = useCheckoutStore(s => s.personalInfo)
  const setPersonalInfo = useCheckoutStore(s => s.setPersonalInfo)
  const address = useCheckoutStore(s => s.address)
  const setAddress = useCheckoutStore(s => s.setAddress)
  const contact = useCheckoutStore(s => s.contact)
  const setContact = useCheckoutStore(s => s.setContact)

  const handleScan = () => {
    setIdVerified(true)
    setShowForm(true)
    setPersonalInfo({ firstName: 'John', lastName: 'Doe' })
  }

  return (
    <div style={{ padding: '22px 20px' }}>
      <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[10px]">Verify Your Identity</div>

      {/* ID Scan */}
      <div
        onClick={handleScan}
        style={{ padding: 18 }}
        className={`w-full rounded-[14px] cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 text-center mb-[10px] border-[1.5px] ${
          idVerified
            ? 'border-solid border-brand bg-brand-bg'
            : 'border-dashed border-border-light bg-surface-2 hover:bg-surface-3 hover:border-brand-border'
        }`}
      >
        <span className="text-[24px]">{idVerified ? '\u2713' : '\uD83D\uDCF7'}</span>
        <span className={`text-[13px] font-semibold ${idVerified ? 'text-brand' : 'text-text'}`}>
          {idVerified ? 'License Scanned Successfully' : "Scan Your Driver's License"}
        </span>
        <span className="text-[11px] text-text-sec leading-[1.3]">
          {idVerified ? 'John D. \u00b7 DL #D1234567 \u00b7 Verified' : "Take a photo of the front of your license. We'll auto-fill your details."}
        </span>
      </div>

      {!showForm && (
        <span onClick={() => setShowForm(true)} className="block text-center text-[11px] text-text-dim cursor-pointer mb-[14px] hover:text-text-sec transition-colors">
          Or enter information manually
        </span>
      )}

      {showForm && (
        <>
          <div className="mb-[14px]">
            <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[7px]">Personal Info</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="First name" value={personalInfo.firstName} onChange={v => setPersonalInfo({ firstName: v })} />
              <Input placeholder="Last name" value={personalInfo.lastName} onChange={v => setPersonalInfo({ lastName: v })} />
            </div>
            <Input placeholder="Date of birth (MM/DD/YYYY)" value={personalInfo.dob} onChange={v => setPersonalInfo({ dob: v })} className="mb-2" />
            <Input placeholder="Driver's license #" value={personalInfo.dlNumber} onChange={v => setPersonalInfo({ dlNumber: v })} />
          </div>

          <div className="mb-[14px]">
            <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[7px]">Address</div>
            <Input placeholder="Street address" value={address.street} onChange={v => setAddress({ street: v })} className="mb-2" />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="City" value={address.city} onChange={v => setAddress({ city: v })} />
              <Input placeholder="State" value={address.state} onChange={v => setAddress({ state: v })} />
            </div>
            <Input placeholder="ZIP code" value={address.zip} onChange={v => setAddress({ zip: v })} />
          </div>

          <div className="mb-[14px]">
            <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[7px]">Contact</div>
            <Input placeholder="Email address" value={contact.email} onChange={v => setContact({ email: v })} className="mb-2" />
            <Input placeholder="Phone number" value={contact.phone} onChange={v => setContact({ phone: v })} />
          </div>
        </>
      )}
    </div>
  )
}

function Input({ placeholder, value, onChange, className = '' }: { placeholder: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <input
      className={`bg-surface-2 border-[1.5px] border-border rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-text outline-none transition-[border-color] duration-200 w-full placeholder:text-text-dim focus:border-brand ${className}`}
      style={{ padding: '11px 13px' }}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
