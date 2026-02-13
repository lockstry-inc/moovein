import { useState } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import LocationCard from './LocationCard'

export default function LocationGrid() {
  const facilities = useFacilityStore(s => s.facilities)
  const [search, setSearch] = useState('')

  const filtered = search
    ? facilities.filter(f => {
        const q = search.toLowerCase()
        return (
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.state.toLowerCase().includes(q) ||
          f.zip.includes(q)
        )
      })
    : facilities

  // Sort: hasMap facilities first, then alphabetically by state then city
  const sorted = [...filtered].sort((a, b) => {
    if (a.hasMap !== b.hasMap) return a.hasMap ? -1 : 1
    if (a.state !== b.state) return a.state.localeCompare(b.state)
    return a.city.localeCompare(b.city)
  })

  return (
    <section className="py-16 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-white">
              Our Locations
            </h2>
            <span className="text-[12px] font-semibold text-accent bg-accent-bg rounded-full" style={{ padding: '4px 12px' }}>
              {facilities.length}
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by city, state, or zip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-surface border border-border rounded-[10px] text-[13px] text-text font-medium outline-none transition-all duration-200 focus:border-accent-border placeholder:text-text-dim"
            style={{ padding: '10px 16px', width: 260 }}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(f => (
            <LocationCard key={f.id} facility={f} />
          ))}
        </div>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-text-dim text-[14px]">
            No locations match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </section>
  )
}
