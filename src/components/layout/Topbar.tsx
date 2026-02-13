import { useFacilityStore } from '../../stores/facilityStore'

export default function Topbar() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const floor = facility?.floors.find(f => f.id === currentFloorId)

  return (
    <div className="fixed top-0 left-0 right-0 h-[58px] bg-[rgba(6,7,10,0.92)] backdrop-blur-[24px] border-b border-border flex items-center justify-between z-100" style={{ padding: '0 24px 0 20px' }}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden border border-border-light"
          style={{ background: '#1a1c22' }}
        >
          <img src="/moovein.png" alt="Moove In" className="w-[22px] h-[22px]" />
        </div>
        <span className="font-['Playfair_Display',serif] text-[17px] font-semibold text-white">Moove In</span>
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
      {facility && (
        <div className="flex items-center shrink-0" style={{ gap: 14 }}>
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
        </div>
      )}
    </div>
  )
}
