import type { Floor } from '../../types/facility'
import Unit from './Unit'

interface Props {
  floor: Floor
}

export default function FacilityFloor({ floor }: Props) {
  return (
    <div className="relative">
      {/* Floor background */}
      <div
        className="absolute rounded-[12px] bg-surface border border-border z-0"
        style={{
          left: -24,
          top: -24,
          width: floor.width + 48,
          height: floor.height + 48,
        }}
      >
        <div className="absolute inset-0 rounded-[12px] opacity-40" style={{
          backgroundImage: 'linear-gradient(rgba(45,212,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,160,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Facility container */}
      <div className="relative" style={{ width: floor.width, height: floor.height }}>
        {/* Site features */}
        {floor.siteFeatures.map((feat, i) => (
          <div
            key={`feat-${i}`}
            className="absolute bg-surface-2 border border-border rounded-[6px] flex items-center justify-center z-1"
            style={{ left: feat.x, top: feat.y, width: feat.w, height: feat.h }}
          >
            <span className="text-[10px] font-semibold text-text-dim text-center leading-tight">
              {feat.type === 'elevator' ? '\u2195\uFE0F' : feat.type === 'stairs' ? '\uD83D\uDEA7' : feat.label || feat.type.toUpperCase()}
            </span>
          </div>
        ))}

        {/* Units */}
        {floor.units.map((unit, i) => (
          <Unit key={unit.id} unit={unit} index={i} />
        ))}

        {/* Floor label */}
        <div
          className="absolute left-1/2 -translate-x-1/2 font-['Playfair_Display',serif] text-[14px] font-semibold text-text-dim tracking-[1px] whitespace-nowrap z-1"
          style={{ bottom: -20 }}
        >
          {floor.name}
        </div>
      </div>
    </div>
  )
}
