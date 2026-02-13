import { useState, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'

export default function IntroOverlay() {
  const facilities = useFacilityStore(s => s.facilities)
  const selectFacility = useFacilityStore(s => s.selectFacility)
  const dismissIntro = useFacilityStore(s => s.dismissIntro)
  const resetView = useFacilityStore(s => s.resetView)
  const [exiting, setExiting] = useState(false)

  // Load facility list
  useEffect(() => {
    useFacilityStore.getState().loadFacilities()
  }, [])

  const handleSelect = async (id: string) => {
    await selectFacility(id)
    setExiting(true)
    setTimeout(() => {
      dismissIntro()
      // Center map after revealing it
      setTimeout(() => resetView(), 50)
    }, 700)
  }

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center"
      style={{
        background: 'rgba(6, 7, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        animation: exiting ? 'overlayFadeOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' : undefined,
      }}
    >
      <div
        className="w-full max-w-[400px] mx-4"
        style={{
          animation: exiting ? 'overlaySlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'fadeIn 0.5s ease',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4" style={{ background: '#0e1014' }}>
            <img src="/moovein.png" alt="Moove In" className="w-full h-full object-cover" style={{ mixBlendMode: 'screen' }} />
          </div>
          <h1 className="font-['Playfair_Display',serif] text-[28px] font-bold text-white mb-1">Moove In</h1>
          <p className="text-[14px] text-text-sec">Self storage, reimagined.</p>
        </div>

        {/* Facility selector */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-text-dim tracking-[0.8px] uppercase mb-3 text-center">Select a facility</div>
          <div className="flex flex-col gap-3">
            {facilities.map(f => (
              <button
                key={f.id}
                onClick={() => handleSelect(f.id)}
                className="w-full text-left bg-surface border border-border rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-surface-2 hover:border-border-light hover:border-accent-border group"
                style={{ padding: '18px 22px' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-[6px]">
                    <div className="text-[16px] font-semibold text-white group-hover:text-accent transition-colors">{f.name}</div>
                    <div className="text-[13px] text-text-sec leading-[1.3]">{f.address}</div>
                  </div>
                  <div className="text-text-dim text-[20px] group-hover:text-accent transition-colors shrink-0">&rarr;</div>
                </div>
              </button>
            ))}
            {facilities.length === 0 && (
              <div className="text-center py-8 text-text-dim text-[13px]">Loading facilities...</div>
            )}
          </div>
        </div>

        {/* Value prop */}
        <div className="text-center text-[11px] text-text-dim font-medium">
          No deposit &middot; Cancel anytime &middot; Online reservations
        </div>
      </div>
    </div>
  )
}
