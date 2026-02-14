import { UNIT_TYPES } from '../../data/unitTypes'
import type { UnitType } from '../../types/facility'
import { useInView } from '../../hooks/useInView'

const DESCRIPTIONS: Record<UnitType, string> = {
  '5x5': 'Perfect for seasonal items, small boxes, and documents.',
  '5x10': 'Fits a studio apartment or a few pieces of furniture.',
  '5x15': 'Ideal for a small 1-bedroom apartment with appliances.',
  '7.6x10': 'A bit wider — great for bulky items and odd-shaped pieces.',
  '10x10': 'Holds a full 1-bedroom apartment. Our most popular size.',
  '10x15': 'Room for a 2-bedroom apartment or small business inventory.',
  '10x20': 'Fits a 3-bedroom house or large vehicle storage.',
  '10x25': 'Generous space for a full household with extras.',
  '10x30': 'Commercial-grade storage for business or renovation.',
  '10x40': 'Maximum space — ideal for vehicles, boats, or bulk inventory.',
}

const WHAT_FITS: Record<UnitType, string> = {
  '5x5': 'Walk-in closet',
  '5x10': 'Studio apartment',
  '5x15': 'Small 1-bedroom',
  '7.6x10': 'Large closet + garage',
  '10x10': '1-bedroom apartment',
  '10x15': '2-bedroom apartment',
  '10x20': '3-bedroom house',
  '10x25': 'Full household',
  '10x30': 'Half a warehouse',
  '10x40': 'Full house + vehicles',
}

const ORDER: UnitType[] = ['5x5', '5x10', '5x15', '7.6x10', '10x10', '10x15', '10x20', '10x25', '10x30', '10x40']

export default function StorageTypes() {
  const { ref, inView } = useInView()

  return (
    <section id="storage-sizes" className="py-20 px-6 border-t border-border" style={{ background: 'var(--color-surface)' }}>
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <h2
          className="font-['Playfair_Display',serif] text-[28px] font-bold text-text text-center mb-2"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Storage for Every Need
        </h2>
        <p
          className="text-[14px] text-text-sec text-center mb-10"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 80ms',
          }}
        >
          From a single box to a full household, we have the right size.
        </p>

        {/* Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          {ORDER.map((key, i) => {
            const t = UNIT_TYPES[key]
            const isPopular = key === '10x10'
            return (
              <div
                key={key}
                className={`bg-bg border rounded-[14px] flex flex-col snap-center shrink-0 min-w-[180px] md:shrink md:min-w-0 transition-all duration-200 hover:border-border-light relative ${
                  isPopular ? 'border-brand/40' : 'border-border'
                }`}
                style={{
                  padding: '22px 18px',
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(24px)',
                  transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${120 + i * 50}ms`,
                }}
              >
                {isPopular && (
                  <div className="absolute -top-[10px] left-[18px] bg-brand text-white text-[10px] font-bold tracking-[0.5px] uppercase px-2 py-[2px] rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="font-['Playfair_Display',serif] text-[18px] font-semibold text-text mb-1">
                  {t.name}
                </div>
                <div className="text-[13px] text-brand font-semibold mb-1">{t.dims}</div>
                <div className="text-[11px] text-text-dim mb-3">{t.sqft}</div>
                <div className="text-[12px] text-text-sec leading-[1.5] mb-2 flex-1">
                  {DESCRIPTIONS[key]}
                </div>
                <div className="flex items-center gap-[5px] text-[11px] text-text-dim mb-4">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  <span>Comparable to a {WHAT_FITS[key]}</span>
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
