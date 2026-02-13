import { useState, useRef, useEffect, useMemo } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import type { FacilityManifestEntry } from '../../types/facility'

interface Props {
  onCta: () => void
  theme: 'dark' | 'light'
}

const PROMOS = [
  { label: 'Save up to 40% OFF', icon: '★' },
  { label: '$1 First Month Rent', icon: '✦' },
  { label: 'Easy Online Rental', icon: '⚡' },
]

export default function HeroSection({ onCta, theme }: Props) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const facilities = useFacilityStore(s => s.facilities)
  const selectFacility = useFacilityStore(s => s.selectFacility)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return facilities.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q) ||
      f.zip.includes(q)
    ).slice(0, 6)
  }, [query, facilities])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset active index when results change
  useEffect(() => { setActiveIndex(-1) }, [filtered])

  const handleSearch = () => {
    onCta()
    window.dispatchEvent(new CustomEvent('hero-search', { detail: query }))
    setShowDropdown(false)
  }

  const handleSelect = (f: FacilityManifestEntry) => {
    setQuery(f.city + ', ' + f.state)
    setShowDropdown(false)
    if (f.hasMap) {
      selectFacility(f.id)
    } else {
      onCta()
      window.dispatchEvent(new CustomEvent('hero-search', { detail: f.city }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      return
    }
    if (!showDropdown || filtered.length === 0) {
      if (e.key === 'Enter') handleSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? filtered.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) handleSelect(filtered[activeIndex])
      else handleSearch()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowDropdown(e.target.value.trim().length > 0)
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: 'min(85vh, 620px)' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/landing.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[900px] mx-auto flex flex-col items-center justify-center px-6" style={{ minHeight: 'min(85vh, 620px)' }}>
        {/* Promo badges */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8">
          {PROMOS.map(p => (
            <div
              key={p.label}
              className="flex items-center gap-2 rounded-full text-[13px] font-semibold"
              style={{
                padding: '8px 18px',
                background: 'rgba(143, 0, 0, 0.2)',
                border: '1px solid rgba(143, 0, 0, 0.4)',
                color: '#ff9090',
              }}
            >
              <span className="text-[11px]">{p.icon}</span>
              {p.label}
            </div>
          ))}
        </div>

        {/* Brand heading */}
        <div className="flex items-baseline justify-center gap-3 mb-3">
          <h1 className="font-['Playfair_Display',serif] text-[40px] md:text-[56px] font-bold" style={{ color: '#ffffff' }}>
            Moove In
          </h1>
          <span className="text-[14px] md:text-[18px] font-semibold tracking-[3px] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Self Storage
          </span>
        </div>

        {/* Subheading */}
        <p className="font-['Playfair_Display',serif] text-[28px] md:text-[40px] font-bold text-center mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Find Storage Near You
        </p>
        <p className="text-[15px] text-center mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {facilities.length} locations across the Northeast &amp; Mid-Atlantic
        </p>

        {/* Search bar with autocomplete */}
        <div ref={wrapperRef} className="w-full max-w-[560px] relative">
          <div
            className="flex items-center overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              borderRadius: showDropdown && filtered.length > 0 ? '24px 24px 0 0' : '9999px',
              transition: 'border-radius 0.15s',
            }}
          >
            {/* Search icon */}
            <div className="pl-5 pr-2 flex items-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter city, state, or zip code..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.trim() && setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium"
              style={{
                padding: '16px 12px',
                color: '#ffffff',
              }}
            />
            <button
              onClick={handleSearch}
              className="shrink-0 bg-brand text-white font-semibold text-[14px] cursor-pointer transition-all duration-200 hover:brightness-125 active:scale-[0.97]"
              style={{
                padding: '12px 28px',
                margin: '5px',
                borderRadius: '9999px',
              }}
            >
              Find Storage
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && filtered.length > 0 && (
            <div
              className="absolute left-0 right-0 z-20 overflow-hidden"
              style={{
                background: 'rgba(15,17,24,0.95)',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
                borderRight: '1px solid rgba(255,255,255,0.12)',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0 0 16px 16px',
                backdropFilter: 'blur(12px)',
              }}
            >
              {filtered.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => handleSelect(f)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="w-full flex items-center gap-3 text-left cursor-pointer transition-colors duration-100"
                  style={{
                    padding: '12px 20px',
                    background: i === activeIndex ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                >
                  {/* Pin icon */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate" style={{ color: '#ffffff' }}>
                      {f.name}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {f.city}, {f.state} {f.zip}
                    </div>
                  </div>
                  {f.hasMap ? (
                    <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--color-accent)', padding: '2px 8px', background: 'rgba(45,212,160,0.12)', borderRadius: '6px' }}>
                      View Map
                    </span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {['No Deposit', 'Cancel Anytime', '24/7 Access', 'Online Reservations'].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
