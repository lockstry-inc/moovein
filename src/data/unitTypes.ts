import type { UnitType, UnitTypeConfig } from '../types/facility'

export const UNIT_TYPES: Record<UnitType, UnitTypeConfig> = {
  '5x5':    { name: 'Compact',       dims: "5'\u00d75'",       sqft: '25 sq ft',  price: 49,  ceiling: '8 ft',  access: 'Walk-in' },
  '5x10':   { name: 'Small',         dims: "5'\u00d710'",      sqft: '50 sq ft',  price: 79,  ceiling: '8 ft',  access: 'Roll-up' },
  '5x15':   { name: 'Small+',        dims: "5'\u00d715'",      sqft: '75 sq ft',  price: 109, ceiling: '8 ft',  access: 'Roll-up' },
  '7.6x10': { name: 'Mid-Size',      dims: "7\u20326\u2033\u00d710'", sqft: '76 sq ft',  price: 119, ceiling: '9 ft',  access: 'Roll-up' },
  '10x10':  { name: 'Standard',      dims: "10'\u00d710'",     sqft: '100 sq ft', price: 149, ceiling: '9 ft',  access: 'Roll-up' },
  '10x15':  { name: 'Large',         dims: "10'\u00d715'",     sqft: '150 sq ft', price: 189, ceiling: '9 ft',  access: 'Roll-up' },
  '10x20':  { name: 'Extra Large',   dims: "10'\u00d720'",     sqft: '200 sq ft', price: 229, ceiling: '10 ft', access: 'Drive-up' },
  '10x25':  { name: 'Oversized',     dims: "10'\u00d725'",     sqft: '250 sq ft', price: 269, ceiling: '10 ft', access: 'Drive-up' },
  '10x30':  { name: 'Warehouse',     dims: "10'\u00d730'",     sqft: '300 sq ft', price: 309, ceiling: '10 ft', access: 'Drive-up' },
  '10x40':  { name: 'Garage',        dims: "10'\u00d740'",     sqft: '400 sq ft', price: 399, ceiling: '10 ft', access: 'Drive-up' },
}
