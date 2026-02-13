import { useRef, useEffect, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useFacilityStore } from '../../stores/facilityStore'
import type { FacilityManifestEntry } from '../../types/facility'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFrZXItc29hciIsImEiOiJjbWxrY3YxenEwMHByM2dvam41aHU1YTc1In0.m_d-qvD5Cm9P8PfFN5wsKw'

function buildPopupHTML(f: FacilityManifestEntry) {
  return `<div style="font-family: 'DM Sans', sans-serif;">
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
      ? `<button data-facility-id="${f.id}" style="width: 100%; background: #2dd4a0; color: #06070a; border: none; border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;">View Location &rarr;</button>`
      : `<div style="text-align: center; font-size: 11px; color: #4e4f58; padding: 6px 0;">Interactive map coming soon</div>`
    }
  </div>`
}

export default function LocationMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const hoveredIdRef = useRef<number | null>(null)
  const facilities = useFacilityStore(s => s.facilities)
  const selectFacility = useFacilityStore(s => s.selectFacility)

  const selectFacilityRef = useRef(selectFacility)
  selectFacilityRef.current = selectFacility

  const facilitiesRef = useRef(facilities)
  facilitiesRef.current = facilities

  // Global click handler for popup CTA buttons
  const handlePopupClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    const facilityId = target.getAttribute('data-facility-id')
    if (facilityId) {
      popupRef.current?.remove()
      selectFacilityRef.current(facilityId)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handlePopupClick)
    return () => document.removeEventListener('click', handlePopupClick)
  }, [handlePopupClick])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || facilities.length === 0) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-76.5, 40.0],
      zoom: 5.5,
      attributionControl: false,
      logoPosition: 'top-left',
      scrollZoom: true,
    })

    // Remove Mapbox logo
    map.on('load', () => {
      const logo = mapContainer.current?.querySelector('.mapboxgl-ctrl-logo')
      if (logo) (logo as HTMLElement).style.display = 'none'
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      // Add facility data as a GeoJSON source with generateId for feature-state
      map.addSource('facilities', {
        type: 'geojson',
        generateId: true,
        data: {
          type: 'FeatureCollection',
          features: facilitiesRef.current.map(f => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [f.lng, f.lat],
            },
            properties: { id: f.id },
          })),
        },
      })

      // Outer glow circle — radius driven by feature-state hover
      map.addLayer({
        id: 'facility-glow',
        type: 'circle',
        source: 'facilities',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            18,
            12,
          ],
          'circle-color': 'rgba(45, 212, 160, 0.15)',
          'circle-blur': 0.8,
        },
      })

      // Main dot — radius driven by feature-state hover
      map.addLayer({
        id: 'facility-dots',
        type: 'circle',
        source: 'facilities',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            8,
            6,
          ],
          'circle-color': '#2dd4a0',
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(45, 212, 160, 0.5)',
        },
      })

      // Hover: set feature-state on individual feature only
      map.on('mousemove', 'facility-dots', (e) => {
        if (!e.features || e.features.length === 0) return
        const fid = e.features[0].id as number

        // Clear previous hover
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== fid) {
          map.setFeatureState({ source: 'facilities', id: hoveredIdRef.current }, { hover: false })
        }

        hoveredIdRef.current = fid
        map.setFeatureState({ source: 'facilities', id: fid }, { hover: true })
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'facility-dots', () => {
        if (hoveredIdRef.current !== null) {
          map.setFeatureState({ source: 'facilities', id: hoveredIdRef.current }, { hover: false })
          hoveredIdRef.current = null
        }
        map.getCanvas().style.cursor = ''
      })

      // Click: show popup
      map.on('click', 'facility-dots', (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const id = feature.properties?.id
        const f = facilitiesRef.current.find(fac => fac.id === id)
        if (!f) return

        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number]

        // Close existing popup
        popupRef.current?.remove()

        const popup = new mapboxgl.Popup({
          offset: 14,
          closeButton: true,
          maxWidth: '260px',
        })
          .setLngLat(coords)
          .setHTML(buildPopupHTML(f))
          .addTo(map)

        popupRef.current = popup
      })
    })

    mapRef.current = map

    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [facilities])

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
