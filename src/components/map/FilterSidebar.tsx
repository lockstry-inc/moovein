import { useFacilityStore } from '../../stores/facilityStore'
import { UNIT_TYPES } from '../../data/unitTypes'
import { FEATURE_ICONS, FEATURE_LABELS } from '../../data/features'
import type { UnitType } from '../../types/facility'

const FILTER_OPTIONS: { key: UnitType; label: string; dims: string; price: string }[] = [
  { key: 'xs', label: 'Locker', dims: "3'\u00d74'", price: '$39' },
  { key: 'sm', label: 'Compact', dims: "5'\u00d75'", price: '$69' },
  { key: 'md', label: 'Standard', dims: "5'\u00d710'", price: '$109' },
  { key: 'lg', label: 'Large', dims: "10'\u00d710'", price: '$149' },
  { key: 'xl', label: 'Extra Large', dims: "10'\u00d720'", price: '$229' },
]

const LEGEND_FEATURES = ['climate', 'driveup', 'ext', 'smartlock', 'power', 'alarm'] as const

export default function FilterSidebar() {
  const filterSidebarOpen = useFacilityStore(s => s.filterSidebarOpen)
  const toggleFilterSidebar = useFacilityStore(s => s.toggleFilterSidebar)
  const activeFilters = useFacilityStore(s => s.activeFilters)
  const toggleFilter = useFacilityStore(s => s.toggleFilter)
  const clearFilters = useFacilityStore(s => s.clearFilters)
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)

  const floor = facility?.floors.find(f => f.id === currentFloorId)

  return (
    <>
      {/* Sidebar */}
      <div
        className="fixed top-[70px] left-3 w-[206px] bg-surface border border-border rounded-[12px] z-95 overflow-hidden transition-all duration-350"
        style={{
          transform: filterSidebarOpen ? 'translateX(0)' : 'translateX(-224px)',
          opacity: filterSidebarOpen ? 1 : 0,
          pointerEvents: filterSidebarOpen ? 'auto' : 'none',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="px-[14px] pt-3 pb-[10px] flex items-center justify-between border-b border-border">
          <span className="text-[11px] font-bold text-text tracking-[0.5px] uppercase">Filter Units</span>
          <div className="flex gap-[3px] items-center">
            {activeFilters.size > 0 && (
              <button onClick={clearFilters} className="text-[11px] font-semibold text-text-dim bg-transparent border-none font-['DM_Sans',sans-serif] px-[7px] py-[2px] rounded-[4px] cursor-pointer transition-all duration-150 hover:text-accent hover:bg-accent-bg">
                Clear
              </button>
            )}
            <button onClick={toggleFilterSidebar} className="text-[11px] font-semibold text-text-dim bg-transparent border-none font-['DM_Sans',sans-serif] px-[7px] py-[2px] rounded-[4px] cursor-pointer transition-all duration-150 hover:text-accent hover:bg-accent-bg">
              &times;
            </button>
          </div>
        </div>

        {/* Size filters */}
        <div className="p-[10px_14px]">
          <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[7px]">Unit Size</div>
          <div className="flex flex-col gap-[3px]">
            {FILTER_OPTIONS.map(f => {
              const isOn = activeFilters.has(f.key)
              const count = floor?.units.filter(u => u.type === f.key && !u.occ).length ?? 0
              return (
                <div
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={`flex items-center justify-between p-[8px_10px] rounded-[8px] cursor-pointer transition-all duration-200 select-none border-[1.5px] ${
                    isOn
                      ? 'bg-accent-bg border-accent'
                      : 'bg-surface-2 border-transparent hover:bg-surface-3 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-[7px]">
                    <div className={`w-[14px] h-[14px] rounded-[4px] flex items-center justify-center text-[8px] shrink-0 border-[1.5px] transition-all duration-200 ${
                      isOn ? 'bg-accent border-accent text-bg' : 'border-border text-transparent'
                    }`}>
                      &#10003;
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-text">{f.label}</span>
                      <span className="text-[10px] text-text-dim">{f.dims}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[11px] font-bold transition-colors duration-200 ${isOn ? 'text-accent' : 'text-text-dim'}`}>
                      {count} avail
                    </span>
                    <span className="text-[10px] text-text-dim">from {f.price}/mo</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Feature legend */}
        <div className="px-[14px] pt-[10px] pb-3 border-t border-border">
          <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[7px]">Feature Icons</div>
          <div className="flex flex-wrap gap-x-[10px] gap-y-[4px]">
            {LEGEND_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-[5px] text-[10px] text-text-sec font-medium">
                <span className="text-[11px] w-4 text-center">{FEATURE_ICONS[f]}</span>
                <span>{FEATURE_LABELS[f]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle button when sidebar hidden */}
      {!filterSidebarOpen && (
        <button
          onClick={toggleFilterSidebar}
          className="fixed top-[70px] left-3 w-[42px] h-[42px] bg-surface border border-border rounded-[10px] z-94 cursor-pointer flex items-center justify-center transition-all duration-200 text-[15px] text-text-sec hover:bg-surface-2 hover:text-text"
        >
          &#9776;
        </button>
      )}
    </>
  )
}
