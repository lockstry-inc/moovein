import { useFacilityStore } from '../../stores/facilityStore'

export default function Topbar() {
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const floor = facility?.floors.find(f => f.id === currentFloorId)

  return (
    <div className="fixed top-0 left-0 right-0 h-[58px] bg-[rgba(6,7,10,0.92)] backdrop-blur-[24px] border-b border-border flex items-center justify-between px-[22px] z-100">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border-light"
          style={{ background: '#1a1c22' }}
        >
          <img src="/moovein.png" alt="Moove In" className="w-[15px] h-[15px]" />
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
      <div className="flex items-center gap-2">
        {facility && (
          <>
            <span className="text-[12px] text-text-dim font-medium">{facility.hours}</span>
            <div className="w-px h-4 bg-border" />
            <span className="text-[12px] text-text-dim font-medium">{facility.phone}</span>
          </>
        )}
      </div>
    </div>
  )
}
