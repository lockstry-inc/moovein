import type { Floor } from '../../types/facility'
import Unit from './Unit'

interface Props {
  floor: Floor
}

export default function FacilityFloor({ floor }: Props) {
  return (
    <div className="relative">
      {/* Floor background — padding/radius scaled for large coordinate space */}
      <div
        className="absolute bg-surface border border-border z-0"
        style={{
          left: -120,
          top: -120,
          width: floor.width + 240,
          height: floor.height + 240,
          borderRadius: 60,
          borderWidth: 5,
        }}
      >
        <div className="absolute inset-0 opacity-40" style={{
          borderRadius: 60,
          backgroundImage: 'linear-gradient(rgba(143,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(143,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '200px 200px',
        }} />
      </div>

      {/* Facility container */}
      <div className="relative" style={{ width: floor.width, height: floor.height }}>
        {/* Site features */}
        {floor.siteFeatures.map((feat, i) => (
          <div
            key={`feat-${i}`}
            className="absolute bg-surface-2 flex items-center justify-center z-1"
            style={{ left: feat.x, top: feat.y, width: feat.w, height: feat.h, borderRadius: 30, border: '5px solid var(--color-border)' }}
          >
            <span className="font-semibold text-text-dim text-center leading-tight" style={{ fontSize: 50 }}>
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
          className="absolute left-1/2 -translate-x-1/2 font-['Playfair_Display',serif] font-semibold text-text-dim whitespace-nowrap z-1"
          style={{ bottom: -100, fontSize: 70, letterSpacing: 5 }}
        >
          {floor.name}
        </div>
      </div>
    </div>
  )
}
