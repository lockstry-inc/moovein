import { useState, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import LocationCard from './LocationCard'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function LocationGrid() {
  const facilities = useFacilityStore(s => s.facilities)
  const [search, setSearch] = useState('')
  // Default center: Richland, York PA (primary facility) — ensures PA/NJ/MD
  // locations sort near the top even when geolocation is unavailable
  const DEFAULT_CENTER = { lat: 39.9426, lng: -76.7144 }
  const [sortCenter, setSortCenter] = useState(DEFAULT_CENTER)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setSortCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently fail — keeps Richland-based fallback
    )
  }, [])

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

  const sorted = [...filtered].sort((a, b) => {
    // hasMap facilities always first
    if (a.hasMap !== b.hasMap) return a.hasMap ? -1 : 1
    // Sort by proximity to user (or fallback center)
    const distA = haversineDistance(sortCenter.lat, sortCenter.lng, a.lat, a.lng)
    const distB = haversineDistance(sortCenter.lat, sortCenter.lng, b.lat, b.lng)
    return distA - distB
  })

  return (
    <section className="py-16 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-text">
              Our Locations
            </h2>
            <span className="text-[12px] font-semibold text-brand bg-brand-bg rounded-full" style={{ padding: '4px 12px' }}>
              {facilities.length}
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by city, state, or zip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-surface border border-border rounded-[10px] text-[13px] text-text font-medium outline-none transition-all duration-200 focus:border-brand-border placeholder:text-text-dim w-full md:w-[260px]"
            style={{ padding: '10px 16px' }}
          />
        </div>

        <div className="text-[11px] text-text-dim font-medium mb-4">
          Sorted by proximity to your location
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
