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
        className="fixed top-[70px] left-3 bg-surface border border-border rounded-[14px] z-95 overflow-hidden transition-all duration-350"
        style={{
          width: 240,
          transform: filterSidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
          opacity: filterSidebarOpen ? 1 : 0,
          pointerEvents: filterSidebarOpen ? 'auto' : 'none',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px 12px' }} className="flex items-center justify-between border-b border-border">
          <span className="text-[11px] font-bold text-text tracking-[0.5px] uppercase">Filter Units</span>
          <div className="flex gap-1 items-center">
            {activeFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-text-dim bg-transparent border-none font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-150 hover:text-accent hover:bg-accent-bg"
                style={{ padding: '4px 10px', borderRadius: 6 }}
              >
                Clear
              </button>
            )}
            <button
              onClick={toggleFilterSidebar}
              className="text-[14px] font-semibold text-text-dim bg-transparent border-none font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-150 hover:text-accent hover:bg-accent-bg"
              style={{ padding: '4px 8px', borderRadius: 6 }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Size filters */}
        <div style={{ padding: '14px 16px' }}>
          <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-2">Unit Size</div>
          <div className="flex flex-col gap-[5px]">
            {FILTER_OPTIONS.map(f => {
              const isOn = activeFilters.has(f.key)
              const count = floor?.units.filter(u => u.type === f.key && !u.occ).length ?? 0
              return (
                <div
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={`flex items-center justify-between rounded-[10px] cursor-pointer transition-all duration-200 select-none border-[1.5px] ${
                    isOn
                      ? 'bg-accent-bg border-accent'
                      : 'bg-surface-2 border-transparent hover:bg-surface-3 hover:border-border'
                  }`}
                  style={{ padding: '10px 12px' }}
                >
                  <div className="flex items-center gap-[9px]">
                    <div className={`w-[16px] h-[16px] rounded-[5px] flex items-center justify-center text-[9px] shrink-0 border-[1.5px] transition-all duration-200 ${
                      isOn ? 'bg-accent border-accent text-bg' : 'border-border text-transparent'
                    }`}>
                      &#10003;
                    </div>
                    <div className="flex flex-col gap-[1px]">
                      <span className="text-[13px] font-semibold text-text">{f.label}</span>
                      <span className="text-[11px] text-text-dim">{f.dims}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-[1px]">
                    <span className={`text-[12px] font-bold transition-colors duration-200 ${isOn ? 'text-accent' : 'text-text-dim'}`}>
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
        <div style={{ padding: '12px 18px 14px' }} className="border-t border-border">
          <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-2">Feature Icons</div>
          <div className="flex flex-wrap gap-x-3 gap-y-[6px]">
            {LEGEND_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-[6px] text-[11px] text-text-sec font-medium">
                <span className="text-[12px] w-4 text-center">{FEATURE_ICONS[f]}</span>
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
          className="fixed top-[70px] left-3 w-[44px] h-[44px] bg-surface border border-border rounded-[12px] z-94 cursor-pointer flex items-center justify-center transition-all duration-200 text-[16px] text-text-sec hover:bg-surface-2 hover:text-text"
        >
          &#9776;
        </button>
      )}
    </>
  )
}
