import { useState } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'

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
  const facilities = useFacilityStore(s => s.facilities)

  const handleSearch = () => {
    onCta()
    // Dispatch a custom event so LocationGrid can pick up the search query
    window.dispatchEvent(new CustomEvent('hero-search', { detail: query }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
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

        {/* Heading */}
        <h1
          className="font-['Playfair_Display',serif] text-[40px] md:text-[56px] font-bold text-center leading-[1.1] mb-4"
          style={{ color: '#ffffff' }}
        >
          Find Self-Storage<br />Near You
        </h1>

        {/* Subheading */}
        <p className="text-[16px] md:text-[18px] text-center mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {facilities.length} locations across the Northeast &amp; Mid-Atlantic
        </p>

        {/* Search bar */}
        <div
          className="w-full max-w-[560px] flex items-center rounded-full overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
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
            onChange={e => setQuery(e.target.value)}
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
