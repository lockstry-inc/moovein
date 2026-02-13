import type { UnitType, UnitTypeConfig } from '../types/facility'

export const UNIT_TYPES: Record<UnitType, UnitTypeConfig> = {
  xs: { name: 'Locker', dims: "3'\u00d74'", sqft: '12 sq ft', price: 39, ceiling: '6 ft', access: 'Walk-in' },
  sm: { name: 'Compact', dims: "5'\u00d75'", sqft: '25 sq ft', price: 69, ceiling: '8 ft', access: 'Roll-up' },
  md: { name: 'Standard', dims: "5'\u00d710'", sqft: '50 sq ft', price: 109, ceiling: '9 ft', access: 'Roll-up' },
  lg: { name: 'Large', dims: "10'\u00d710'", sqft: '100 sq ft', price: 149, ceiling: '9 ft', access: 'Roll-up' },
  xl: { name: 'Extra Large', dims: "10'\u00d720'", sqft: '200 sq ft', price: 229, ceiling: '10 ft', access: 'Drive-up' },
}
