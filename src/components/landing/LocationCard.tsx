import type { FacilityManifestEntry } from '../../types/facility'
import { useFacilityStore } from '../../stores/facilityStore'

export default function LocationCard({ facility }: { facility: FacilityManifestEntry }) {
  const selectFacility = useFacilityStore(s => s.selectFacility)

  return (
    <button
      onClick={() => facility.hasMap && selectFacility(facility.id)}
      className={`w-full text-left bg-surface border border-border rounded-[14px] transition-all duration-200 group ${
        facility.hasMap
          ? 'cursor-pointer hover:border-brand-border'
          : 'cursor-default opacity-70'
      }`}
      style={{ padding: '18px 20px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-[6px] min-w-0">
          <div className={`text-[15px] font-semibold text-text transition-colors ${
            facility.hasMap ? 'group-hover:text-brand' : ''
          }`}>
            {facility.name.replace('Moove In ', '')}
          </div>
          <div className="text-[13px] text-text-sec leading-[1.3]">
            {facility.address}, {facility.city}, {facility.state} {facility.zip}
          </div>
          <div className="text-[12px] text-text-dim">{facility.phone}</div>

          {/* Size pills */}
          <div className="flex flex-wrap gap-[5px] mt-1">
            {facility.sizes.map(s => (
              <span
                key={s}
                className="text-[10px] font-semibold text-brand bg-brand-bg rounded-full"
                style={{ padding: '3px 9px' }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Feature tags */}
          {facility.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {facility.features.map(f => (
                <span key={f} className="text-[10px] text-text-dim font-medium">{f}</span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 mt-1">
          {facility.hasMap ? (
            <span className="text-text-dim text-[18px] group-hover:text-brand transition-colors">&rarr;</span>
          ) : (
            <span className="text-[10px] text-text-dim font-medium bg-surface-2 rounded-full" style={{ padding: '4px 10px' }}>
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
