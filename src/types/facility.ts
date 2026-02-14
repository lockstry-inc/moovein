export type UnitType =
  | '5x5' | '5x10' | '5x15'
  | '7.6x10'
  | '10x10' | '10x15' | '10x20' | '10x25' | '10x30' | '10x40'

export interface UnitTypeConfig {
  name: string
  dims: string
  sqft: string
  price: number
  ceiling: string
  access: string
}

export interface UnitData {
  id: string
  x: number
  y: number
  w: number
  h: number
  type: UnitType
  occ: number
  climate?: number
  driveup?: number
  ext?: number
  smartlock?: number
  power?: number
  alarm?: number
}

export interface SiteFeature {
  type: 'office' | 'elevator' | 'highlight' | 'stairs'
  label?: string
  x: number
  y: number
  w: number
  h: number
}

export interface Floor {
  id: string
  name: string
  width: number
  height: number
  units: UnitData[]
  siteFeatures: SiteFeature[]
}

export interface FacilityHours {
  office: { label: string; time: string }[]
  gate: string
}

export interface Facility {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  officeHours: FacilityHours
  floors: Floor[]
}

export interface FacilityManifestEntry {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  hours: string
  lat: number
  lng: number
  sizes: string[]
  features: string[]
  hasMap: boolean
  dataUrl: string
}
