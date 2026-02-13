import { useFacilityStore } from '../../stores/facilityStore'
import { useTheme } from '../../hooks/useTheme'

export default function Topbar() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const goToLanding = useFacilityStore(s => s.goToLanding)
  const floor = facility?.floors.find(f => f.id === currentFloorId)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="fixed top-0 left-0 right-0 h-[58px] bg-surface/92 backdrop-blur-[24px] border-b border-border flex items-center justify-between z-100" style={{ padding: '0 24px 0 20px' }}>
      <div className="flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={goToLanding}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-text-sec hover:text-brand transition-colors duration-200 shrink-0"
          style={{ padding: '4px 0' }}
        >
          <span className="text-[16px]">&larr;</span>
          <span className="text-[12px] font-medium hidden md:inline">All Locations</span>
        </button>

        <div className="w-px h-5 bg-border" />

        <div
          className="w-10 h-10 rounded-[10px] shrink-0 overflow-hidden bg-surface-2"
        >
          <img src="/moovein.png" alt="Moove In" className="w-full h-full object-cover logo-blend" />
        </div>
        <span className="font-['Playfair_Display',serif] text-[17px] font-semibold text-text">Moove In</span>
        {facility && (
          <>
            <div className="w-px h-5 bg-border" />
            <span className="text-[13px] text-text-sec font-medium">
              {facility.name.replace('Moove In ', '')}
              {floor ? ` \u00b7 ${floor.name}` : ''}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center shrink-0" style={{ gap: 14 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border border-border bg-surface transition-all duration-200 hover:border-border-light"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-[16px]">
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </span>
        </button>
      {facility && (
        <>
          <div className="w-px h-8 bg-border shrink-0" />
          {facility.officeHours ? (
            <div className="flex flex-col items-end" style={{ gap: 1 }}>
              {facility.officeHours.office
                .filter(h => h.time !== 'Closed')
                .map((h, i) => (
                  <span key={i} className="text-[11px] text-text-dim font-medium whitespace-nowrap">
                    {h.label} {h.time}
                  </span>
                ))
              }
              <span className="text-[11px] text-text-dim font-medium whitespace-nowrap">
                Gate {facility.officeHours.gate}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-text-dim font-medium whitespace-nowrap">{facility.hours}</span>
          )}
          <div className="w-px h-8 bg-border shrink-0" />
          <span className="text-[12px] text-text-sec font-medium shrink-0 whitespace-nowrap">
            {facility.phone}
          </span>
        </>
      )}
      </div>
    </div>
  )
}
