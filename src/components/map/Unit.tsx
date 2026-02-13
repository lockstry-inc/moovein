import { memo, useCallback } from 'react'
import type { UnitData } from '../../types/facility'
import { useFacilityStore } from '../../stores/facilityStore'
import { getUnitFeatureList } from '../../data/features'

interface Props {
  unit: UnitData
  index: number
}

const Unit = memo(function Unit({ unit, index }: Props) {
  const selectedUnitId = useFacilityStore(s => s.selectedUnitId)
  const activeFilters = useFacilityStore(s => s.activeFilters)
  const selectUnit = useFacilityStore(s => s.selectUnit)

  const isOccupied = !!unit.occ
  const isSelected = selectedUnitId === unit.id
  const hasFilters = activeFilters.size > 0
  const matchesFilter = hasFilters && activeFilters.has(unit.type)
  const isDimmed = hasFilters && !matchesFilter
  const isHighlighted = matchesFilter && !isOccupied

  const feats = getUnitFeatureList(unit)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOccupied) selectUnit(unit.id)
  }, [isOccupied, selectUnit, unit.id])

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    useFacilityStore.getState().showTooltip(unit.id, e.clientX + 18, e.clientY - 12)
  }, [unit.id])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    let x = e.clientX + 18
    const y = e.clientY - 12
    if (x + 200 > window.innerWidth) x = e.clientX - 200
    useFacilityStore.getState().moveTooltip(x, y)
  }, [])

  const handleMouseLeave = useCallback(() => {
    useFacilityStore.getState().hideTooltip()
  }, [])

  const className = [
    'unit',
    isOccupied ? 'occupied' : 'vacant',
    isSelected && 'sel-u',
    isDimmed && 'dimmed',
    isHighlighted && 'hl show-feats',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      style={{
        left: unit.x,
        top: unit.y,
        width: unit.w,
        height: unit.h,
        animation: `unitIn 0.35s ${index * 8}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-id={unit.id}
      aria-label={`Unit ${unit.id}, ${isOccupied ? 'Occupied' : 'Vacant'}`}
    >
      <span className="unit-id">{unit.id}</span>
      <div className="unit-feats">
        {feats.map(f => (
          <span key={f.key} className="unit-feat">{f.icon}</span>
        ))}
      </div>
    </div>
  )
})

export default Unit
