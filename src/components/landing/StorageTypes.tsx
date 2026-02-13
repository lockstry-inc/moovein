import { UNIT_TYPES } from '../../data/unitTypes'
import type { UnitType } from '../../types/facility'

const DESCRIPTIONS: Record<UnitType, string> = {
  xs: 'Perfect for seasonal items, small boxes, and documents.',
  sm: 'Fits a studio apartment or a few pieces of furniture.',
  md: 'Holds a 1-bedroom apartment. Our most popular size.',
  lg: 'Room for a 2-bedroom apartment or vehicle storage.',
  xl: 'Full house, business inventory, or multiple vehicles.',
}

const ORDER: UnitType[] = ['xs', 'sm', 'md', 'lg', 'xl']

export default function StorageTypes() {
  return (
    <section className="py-20 px-6 border-t border-border" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-white text-center mb-2">
          Storage for Every Need
        </h2>
        <p className="text-[14px] text-text-sec text-center mb-10">
          From a single box to a full household, we have the right size.
        </p>

        {/* Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          {ORDER.map(key => {
            const t = UNIT_TYPES[key]
            return (
              <div
                key={key}
                className="bg-bg border border-border rounded-[14px] flex flex-col snap-center shrink-0 min-w-[180px] md:shrink md:min-w-0 transition-all duration-200 hover:border-border-light"
                style={{ padding: '22px 18px' }}
              >
                <div className="font-['Playfair_Display',serif] text-[18px] font-semibold text-white mb-1">
                  {t.name}
                </div>
                <div className="text-[13px] text-brand font-semibold mb-1">{t.dims}</div>
                <div className="text-[11px] text-text-dim mb-3">{t.sqft}</div>
                <div className="text-[12px] text-text-sec leading-[1.5] mb-4 flex-1">
                  {DESCRIPTIONS[key]}
                </div>
                <div className="text-[15px] font-bold text-text">
                  from ${t.price}<span className="text-[11px] font-normal text-text-dim">/mo</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
