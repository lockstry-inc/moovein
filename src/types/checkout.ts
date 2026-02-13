export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface PersonalInfo {
  firstName: string
  lastName: string
  dob: string
  dlNumber: string
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
}

export interface Contact {
  email: string
  phone: string
}
