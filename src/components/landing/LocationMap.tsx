import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useFacilityStore } from '../../stores/facilityStore'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFrZXItc29hciIsImEiOiJjbWxrY3YxenEwMHByM2dvam41aHU1YTc1In0.m_d-qvD5Cm9P8PfFN5wsKw'

export default function LocationMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const facilities = useFacilityStore(s => s.facilities)
  const selectFacility = useFacilityStore(s => s.selectFacility)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-76.5, 40.0],
      zoom: 5.5,
      attributionControl: false,
      cooperativeGestures: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      // Add markers for each facility
      facilities.forEach(f => {
        // Create custom marker element
        const el = document.createElement('div')
        el.style.width = '14px'
        el.style.height = '14px'
        el.style.borderRadius = '50%'
        el.style.background = '#2dd4a0'
        el.style.border = '2px solid rgba(45, 212, 160, 0.5)'
        el.style.cursor = 'pointer'
        el.style.transition = 'all 0.2s ease'
        el.style.boxShadow = '0 0 8px rgba(45, 212, 160, 0.3)'

        el.addEventListener('mouseenter', () => {
          el.style.width = '18px'
          el.style.height = '18px'
          el.style.boxShadow = '0 0 16px rgba(45, 212, 160, 0.5)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.width = '14px'
          el.style.height = '14px'
          el.style.boxShadow = '0 0 8px rgba(45, 212, 160, 0.3)'
        })

        const popup = new mapboxgl.Popup({
          offset: 12,
          closeButton: true,
          maxWidth: '260px',
        }).setHTML(`
          <div style="font-family: 'DM Sans', sans-serif;">
            <div style="font-size: 15px; font-weight: 600; color: #eeeef0; margin-bottom: 4px;">
              ${f.name.replace('Moove In ', '')}
            </div>
            <div style="font-size: 12px; color: #85868f; margin-bottom: 3px;">
              ${f.address}, ${f.city}, ${f.state} ${f.zip}
            </div>
            <div style="font-size: 11px; color: #4e4f58; margin-bottom: 8px;">
              ${f.phone}
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px;">
              ${f.sizes.map(s => `<span style="font-size: 10px; font-weight: 600; color: #2dd4a0; background: rgba(45,212,160,0.16); border-radius: 99px; padding: 2px 8px;">${s}</span>`).join('')}
            </div>
            ${f.hasMap
              ? `<button id="popup-cta-${f.id}" style="width: 100%; background: #2dd4a0; color: #06070a; border: none; border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;">View Location &rarr;</button>`
              : `<div style="text-align: center; font-size: 11px; color: #4e4f58; padding: 6px 0;">Interactive map coming soon</div>`
            }
          </div>
        `)

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([f.lng, f.lat])
          .setPopup(popup)
          .addTo(map)

        // Attach click handler after popup opens
        popup.on('open', () => {
          const btn = document.getElementById(`popup-cta-${f.id}`)
          if (btn) {
            btn.addEventListener('click', () => {
              marker.togglePopup()
              selectFacility(f.id)
            })
          }
        })
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [facilities, selectFacility])

  return (
    <section id="locations" className="py-16 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-white text-center mb-2">
          Find a Location Near You
        </h2>
        <p className="text-[14px] text-text-sec text-center mb-8">
          31 facilities across 10 states. Click a pin to explore.
        </p>

        <div
          ref={mapContainer}
          className="w-full rounded-[14px] border border-border overflow-hidden"
          style={{ height: 'min(70vh, 560px)' }}
        />
      </div>
    </section>
  )
}
