export type UnitType = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

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

export interface Facility {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  floors: Floor[]
}

export interface FacilityManifestEntry {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  dataUrl: string
}
