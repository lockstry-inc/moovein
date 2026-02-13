import { useRef, useEffect, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useFacilityStore } from '../../stores/facilityStore'
import type { FacilityManifestEntry } from '../../types/facility'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmFrZXItc29hciIsImEiOiJjbWxrY3YxenEwMHByM2dvam41aHU1YTc1In0.m_d-qvD5Cm9P8PfFN5wsKw'

const MAP_STYLES = [
  { id: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'satellite', label: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets', label: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
] as const

type MapStyleId = typeof MAP_STYLES[number]['id']

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
      ${f.sizes.map(s => `<span style="font-size: 10px; font-weight: 600; color: #8F0000; background: rgba(143,0,0,0.16); border-radius: 99px; padding: 2px 8px;">${s}</span>`).join('')}
    </div>
    ${f.hasMap
      ? `<button data-facility-id="${f.id}" style="width: 100%; background: #8F0000; color: #ffffff; border: none; border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;">View Location &rarr;</button>`
      : `<div style="text-align: center; font-size: 11px; color: #4e4f58; padding: 6px 0;">Interactive map coming soon</div>`
    }
  </div>`
}

interface Props {
  theme?: 'dark' | 'light'
}

export default function LocationMap({ theme = 'dark' }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const hoveredIdRef = useRef<number | null>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)
  const [activeStyle, setActiveStyle] = useState<MapStyleId>('dark')
  const facilities = useFacilityStore(s => s.facilities)
  const selectFacility = useFacilityStore(s => s.selectFacility)

  const selectFacilityRef = useRef(selectFacility)
  selectFacilityRef.current = selectFacility

  const facilitiesRef = useRef(facilities)
  facilitiesRef.current = facilities

  // Adds custom sources, layers, and interaction handlers after any style load
  const addCustomLayers = useCallback((map: mapboxgl.Map) => {
    // 3D building extrusions (may not be available in all styles)
    try {
      const layers = map.getStyle().layers
      let labelLayerId: string | undefined
      for (const layer of layers || []) {
        if (layer.type === 'symbol' && (layer.layout as Record<string, unknown>)?.['text-field']) {
          labelLayerId = layer.id
          break
        }
      }

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['zoom'],
              12, '#15171c',
              16, '#1d1f26',
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': [
              'interpolate', ['linear'], ['zoom'],
              12, 0,
              13, 0.55,
              16, 0.75,
            ],
          },
        },
        labelLayerId,
      )
    } catch { /* composite source may not exist in all styles */ }

    // Facility data source
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

    // Outer glow circle
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
        'circle-color': 'rgba(143, 0, 0, 0.15)',
        'circle-blur': 0.8,
      },
    })

    // Main dot
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
        'circle-color': '#8F0000',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(143, 0, 0, 0.5)',
      },
    })

    // Hover interaction
    map.on('mousemove', 'facility-dots', (e) => {
      if (!e.features || e.features.length === 0) return
      const fid = e.features[0].id as number
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
  }, [])

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || facilities.length === 0) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[0].url,
      center: [-76.5, 40.0],
      zoom: 5.5,
      minZoom: 4.5,
      pitch: 0,
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

    // Zoom-driven vignette
    map.on('zoom', () => {
      const z = map.getZoom()
      const intensity = Math.max(0, Math.min(1, (z - 6) / 8))
      if (vignetteRef.current) {
        vignetteRef.current.style.opacity = String(intensity * 0.65)
      }
    })

    // Ease pitch after zoom settles
    map.on('moveend', () => {
      const z = map.getZoom()
      const targetPitch = Math.max(0, Math.min(50, (z - 8) * (50 / 6)))
      const currentPitch = map.getPitch()
      if (Math.abs(currentPitch - targetPitch) > 4) {
        map.easeTo({ pitch: targetPitch, duration: 600 })
      }
    })

    // Add custom layers on initial load
    map.once('load', () => {
      addCustomLayers(map)
    })

    // Re-add custom layers after style changes (not initial load)
    let initialLoadDone = false
    map.on('style.load', () => {
      if (!initialLoadDone) {
        initialLoadDone = true
        return
      }
      addCustomLayers(map)
    })

    mapRef.current = map

    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [facilities, addCustomLayers])

  // Handle style switching
  const switchStyle = useCallback((styleId: MapStyleId) => {
    const map = mapRef.current
    if (!map || styleId === activeStyle) return
    const style = MAP_STYLES.find(s => s.id === styleId)
    if (!style) return
    setActiveStyle(styleId)
    map.setStyle(style.url)
  }, [activeStyle])

  // Switch map style when theme changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const targetStyle = theme === 'light' ? 'streets' : 'dark'
    if (activeStyle !== targetStyle) {
      switchStyle(targetStyle as MapStyleId)
    }
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLight = theme === 'light'
  const toggleBg = isLight ? 'rgba(255,255,255,0.82)' : 'rgba(6,7,10,0.75)'
  const vignetteBg = isLight
    ? 'radial-gradient(ellipse at center, transparent 25%, rgba(245,245,247,0.9) 100%)'
    : 'radial-gradient(ellipse at center, transparent 25%, rgba(6,7,10,0.9) 100%)'

  return (
    <section id="locations" className="py-16 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-text text-center mb-2">
          Find a Location Near You
        </h2>
        <p className="text-[14px] text-text-sec text-center mb-8">
          31 facilities across 10 states. Click a pin to explore.
        </p>

        <div
          className="relative w-full rounded-[14px] border border-border overflow-hidden"
          style={{ height: 'min(70vh, 560px)' }}
        >
          <div ref={mapContainer} className="w-full h-full" />

          {/* Style toggle */}
          <div className="absolute top-3 left-3 z-20 flex gap-1 rounded-lg p-1" style={{ background: toggleBg, backdropFilter: 'blur(12px)' }}>
            {MAP_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => switchStyle(s.id)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer border-none"
                style={{
                  background: activeStyle === s.id ? 'var(--color-brand)' : 'transparent',
                  color: activeStyle === s.id ? '#ffffff' : 'var(--color-text-sec)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Vignette overlay — intensifies as you zoom in */}
          <div
            ref={vignetteRef}
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: vignetteBg,
              opacity: 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        </div>
      </div>
    </section>
  )
}
