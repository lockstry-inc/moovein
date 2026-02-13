export interface Addon {
  id: string
  icon: string
  name: string
  description: string
  monthlyPrice: number
  oneTimePrice: number
}

export const ADDONS: Addon[] = [
  { id: 'insurance-basic', icon: '\uD83D\uDEE1\uFE0F', name: 'Tenant Insurance', description: '$5,000 coverage \u00b7 Water, fire, theft', monthlyPrice: 12, oneTimePrice: 0 },
  { id: 'insurance-premium', icon: '\uD83D\uDEE1\uFE0F', name: 'Premium Insurance', description: '$15,000 coverage \u00b7 All perils', monthlyPrice: 22, oneTimePrice: 0 },
  { id: 'smart-lock', icon: '\uD83D\uDD10', name: 'Smart Lock', description: 'Keyless entry via app \u00b7 Activity log', monthlyPrice: 8, oneTimePrice: 0 },
  { id: 'moving-kit', icon: '\uD83D\uDCE6', name: 'Moving Supplies Kit', description: '20 boxes, tape, bubble wrap', monthlyPrice: 0, oneTimePrice: 45 },
  { id: 'shelving', icon: '\uD83D\uDDC4\uFE0F', name: 'Shelving Package', description: 'Pre-installed industrial shelving', monthlyPrice: 0, oneTimePrice: 75 },
]
