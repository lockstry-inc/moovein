import { useFacilityStore } from '../../stores/facilityStore'
import { UNIT_TYPES } from '../../data/unitTypes'
import { FEATURE_ICONS, FEATURE_LABELS } from '../../data/features'
import type { UnitType } from '../../types/facility'

const FILTER_OPTIONS: { key: UnitType; price: string }[] = [
  { key: '5x5',    price: '$49' },
  { key: '5x10',   price: '$79' },
  { key: '5x15',   price: '$109' },
  { key: '7.6x10', price: '$119' },
  { key: '10x10',  price: '$149' },
  { key: '10x15',  price: '$189' },
  { key: '10x20',  price: '$229' },
  { key: '10x25',  price: '$269' },
  { key: '10x30',  price: '$309' },
  { key: '10x40',  price: '$399' },
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
          width: 220,
          transform: filterSidebarOpen ? 'translateX(0)' : 'translateX(-240px)',
          opacity: filterSidebarOpen ? 1 : 0,
          pointerEvents: filterSidebarOpen ? 'auto' : 'none',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '10px 14px 9px' }} className="flex items-center justify-between border-b border-border">
          <span className="text-[11px] font-bold text-text tracking-[0.5px] uppercase">Filter Units</span>
          <div className="flex gap-1 items-center">
            {activeFilters.size > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-text-dim bg-transparent border-none font-['DM_Sans',sans-serif] cursor-pointer transition-all duration-150 hover:text-brand hover:bg-brand-bg"
                style={{ padding: '3px 8px', borderRadius: 6 }}
              >
                Clear
              </button>
            )}
            <button
              onClick={toggleFilterSidebar}
              className="bg-surface-2 border border-border rounded-[8px] text-text-sec text-[13px] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-3 hover:text-text"
              style={{ width: 26, height: 26 }}
            >
              &#10005;
            </button>
          </div>
        </div>

        {/* Size filters */}
        <div style={{ padding: '8px 10px' }}>
          <div className="flex flex-col gap-[3px]">
            {FILTER_OPTIONS.map(f => {
              const isOn = activeFilters.has(f.key)
              const count = floor?.units.filter(u => u.type === f.key && !u.occ).length ?? 0
              return (
                <div
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={`flex items-center justify-between rounded-[8px] cursor-pointer transition-all duration-200 select-none border-[1.5px] ${
                    isOn
                      ? 'bg-brand-bg border-brand'
                      : 'bg-surface-2 border-transparent hover:bg-surface-3 hover:border-border'
                  }`}
                  style={{ padding: '6px 10px' }}
                >
                  <div className="flex items-center gap-[7px]">
                    <div className={`w-[14px] h-[14px] rounded-[4px] flex items-center justify-center text-[8px] shrink-0 border-[1.5px] transition-all duration-200 ${
                      isOn ? 'bg-brand border-brand text-white' : 'border-border text-transparent'
                    }`}>
                      &#10003;
                    </div>
                    <span className="text-[12px] font-semibold text-text">{f.key}</span>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className={`text-[11px] font-bold transition-colors duration-200 ${isOn ? 'text-brand' : 'text-text-dim'}`}>
                      {count}
                    </span>
                    <span className="text-[10px] text-text-dim">{f.price}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Feature legend */}
        <div style={{ padding: '8px 14px 10px' }} className="border-t border-border">
          <div className="text-[9px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[6px]">Features</div>
          <div className="flex flex-wrap gap-x-3 gap-y-[4px]">
            {LEGEND_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-[5px] text-[10px] text-text-sec font-medium">
                <span className="text-[11px] w-3.5 text-center">{FEATURE_ICONS[f]}</span>
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
