export interface LeaseSection {
  number: number
  title: string
  text: string
}

export const LEASE_SECTIONS: LeaseSection[] = [
  { number: 1, title: 'PARTIES', text: 'This Rental Agreement ("Agreement") is entered into between Moove In Self Storage LLC ("Facility") and the Tenant identified in the reservation details.' },
  { number: 2, title: 'UNIT & TERM', text: 'Facility agrees to rent the storage unit identified in Step 1 on a month-to-month basis, beginning on the selected move-in date. Either party may terminate with 30 days written notice.' },
  { number: 3, title: 'RENT & PAYMENT', text: 'Tenant agrees to pay the monthly rental rate plus any selected add-on fees. Rent is due on the 1st of each month. A late fee of $20 applies after the 5th.' },
  { number: 4, title: 'USE OF UNIT', text: 'The unit shall be used solely for storage of personal property. Tenant shall not store hazardous materials, perishables, live animals, or any illegal substances.' },
  { number: 5, title: 'ACCESS', text: 'Tenant may access the unit during facility operating hours or 24/7 if enrolled in the smart access program. Facility reserves the right to restrict access for non-payment.' },
  { number: 6, title: 'INSURANCE', text: 'Tenant is responsible for insuring stored property. Facility provides no coverage unless Tenant has purchased a Tenant Insurance add-on.' },
  { number: 7, title: 'LIABILITY', text: "Facility's liability is limited to the extent permitted by law. Facility is not liable for loss or damage caused by theft, fire, water, weather, insects, or acts of God." },
  { number: 8, title: 'LIEN', text: 'Facility shall have a lien on all personal property stored in the unit for unpaid rent and fees, enforceable under applicable state lien laws.' },
  { number: 9, title: 'GOVERNING LAW', text: 'This Agreement shall be governed by the laws of the state in which the Facility is located.' },
]
