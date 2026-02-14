import { useFacilityStore } from '../../stores/facilityStore'
import type { UnitType } from '../../types/facility'

const CHIPS: { key: UnitType; label: string }[] = [
  { key: '5x5',    label: "5'\u00d75'" },
  { key: '5x10',   label: "5'\u00d710'" },
  { key: '5x15',   label: "5'\u00d715'" },
  { key: '7.6x10', label: "7'6\u2033\u00d710'" },
  { key: '10x10',  label: "10'\u00d710'" },
  { key: '10x15',  label: "10'\u00d715'" },
  { key: '10x20',  label: "10'\u00d720'" },
  { key: '10x25',  label: "10'\u00d725'" },
  { key: '10x30',  label: "10'\u00d730'" },
  { key: '10x40',  label: "10'\u00d740'" },
]

export default function FilterChips() {
  const activeFilters = useFacilityStore(s => s.activeFilters)
  const toggleFilter = useFacilityStore(s => s.toggleFilter)
  const clearFilters = useFacilityStore(s => s.clearFilters)

  return (
    <div className="fixed top-[58px] left-0 right-0 z-95 bg-surface/92 backdrop-blur-[16px] border-b border-border px-3 py-2">
      <div className="flex gap-[6px] overflow-x-auto no-scrollbar">
        {activeFilters.size > 0 && (
          <button
            onClick={clearFilters}
            className="shrink-0 px-3 py-[6px] rounded-full text-[11px] font-semibold bg-occ-bg border border-occ-border text-occ cursor-pointer whitespace-nowrap"
          >
            Clear
          </button>
        )}
        {CHIPS.map(c => {
          const active = activeFilters.has(c.key)
          return (
            <button
              key={c.key}
              onClick={() => toggleFilter(c.key)}
              className={`shrink-0 px-3 py-[6px] rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 border ${
                active
                  ? 'bg-brand-bg border-brand text-brand'
                  : 'bg-surface-2 border-border text-text-sec hover:border-border-light'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
