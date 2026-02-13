import { create } from 'zustand'
import type { CheckoutStep, PersonalInfo, Address, Contact } from '../types/checkout'
import { ADDONS } from '../data/addons'

interface CheckoutState {
  step: CheckoutStep
  selectedAddons: Set<string>
  leaseAgreed: boolean
  leaseBindingAgreed: boolean
  signatureDataUrl: string | null
  idVerified: boolean
  personalInfo: PersonalInfo
  address: Address
  contact: Contact
  selectedDate: string
  paymentAgreed: boolean
  recurringAgreed: boolean
  rulesAgreed: boolean

  // Actions
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: CheckoutStep) => void
  toggleAddon: (id: string) => void
  setPersonalInfo: (info: Partial<PersonalInfo>) => void
  setAddress: (addr: Partial<Address>) => void
  setContact: (contact: Partial<Contact>) => void
  setSelectedDate: (date: string) => void
  setSignature: (dataUrl: string | null) => void
  toggleCheckbox: (field: 'leaseAgreed' | 'leaseBindingAgreed' | 'paymentAgreed' | 'recurringAgreed' | 'rulesAgreed') => void
  setIdVerified: (v: boolean) => void
  reset: () => void
  computeTotal: (unitPrice: number) => { monthly: number; oneTime: number; items: { label: string; amount: string }[] }
}

const initialState = {
  step: 1 as CheckoutStep,
  selectedAddons: new Set<string>(),
  leaseAgreed: false,
  leaseBindingAgreed: false,
  signatureDataUrl: null,
  idVerified: false,
  personalInfo: { firstName: '', lastName: '', dob: '', dlNumber: '' },
  address: { street: '', city: '', state: '', zip: '' },
  contact: { email: '', phone: '' },
  selectedDate: '',
  paymentAgreed: false,
  recurringAgreed: false,
  rulesAgreed: false,
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  ...initialState,

  nextStep: () => set(s => ({ step: Math.min(7, s.step + 1) as CheckoutStep })),
  prevStep: () => set(s => ({ step: Math.max(1, s.step - 1) as CheckoutStep })),
  goToStep: (step) => set({ step }),

  toggleAddon: (id: string) => {
    const addons = new Set(get().selectedAddons)
    if (addons.has(id)) addons.delete(id)
    else addons.add(id)
    set({ selectedAddons: addons })
  },

  setPersonalInfo: (info) => set(s => ({ personalInfo: { ...s.personalInfo, ...info } })),
  setAddress: (addr) => set(s => ({ address: { ...s.address, ...addr } })),
  setContact: (contact) => set(s => ({ contact: { ...s.contact, ...contact } })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSignature: (dataUrl) => set({ signatureDataUrl: dataUrl }),
  toggleCheckbox: (field) => set(s => ({ [field]: !s[field] })),
  setIdVerified: (v) => set({ idVerified: v }),
  reset: () => set({ ...initialState, selectedAddons: new Set() }),

  computeTotal: (unitPrice: number) => {
    const { selectedAddons } = get()
    let monthly = unitPrice
    let oneTime = 0
    const items: { label: string; amount: string }[] = []

    for (const addonId of selectedAddons) {
      const addon = ADDONS.find(a => a.id === addonId)
      if (!addon) continue
      monthly += addon.monthlyPrice
      oneTime += addon.oneTimePrice
      items.push({
        label: addon.name,
        amount: addon.monthlyPrice ? `+$${addon.monthlyPrice}/mo` : `$${addon.oneTimePrice} once`,
      })
    }

    return { monthly, oneTime, items }
  },
}))
