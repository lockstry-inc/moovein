import { create } from 'zustand'
import type { Facility, FacilityManifestEntry, UnitType } from '../types/facility'

type AppPhase = 'landing' | 'map' | 'checkout'

interface TooltipState {
  visible: boolean
  unitId: string
  x: number
  y: number
}

interface FacilityState {
  // Data
  facilities: FacilityManifestEntry[]
  currentFacility: Facility | null
  loading: boolean
  error: string | null

  // App state
  appPhase: AppPhase
  currentFloorId: string

  // Filters
  activeFilters: Set<UnitType>
  filterSidebarOpen: boolean

  // Selection
  selectedUnitId: string | null

  // Viewport
  scale: number
  panX: number
  panY: number
  smoothTransition: number  // 0 = none (drag), >0 = duration in ms

  // Tooltip
  tooltip: TooltipState

  // Actions
  loadFacilities: () => Promise<void>
  selectFacility: (id: string) => Promise<void>
  goToLanding: () => void
  switchFloor: (floorId: string) => void
  toggleFilter: (type: UnitType) => void
  clearFilters: () => void
  toggleFilterSidebar: () => void
  selectUnit: (id: string) => void
  deselectUnit: () => void
  setViewport: (scale: number, panX: number, panY: number) => void
  zoomBy: (delta: number) => void
  resetView: () => void
  showTooltip: (unitId: string, x: number, y: number) => void
  moveTooltip: (x: number, y: number) => void
  hideTooltip: () => void
  goToMap: () => void
}

export const useFacilityStore = create<FacilityState>((set, get) => ({
  facilities: [],
  currentFacility: null,
  loading: false,
  error: null,
  appPhase: 'landing',
  currentFloorId: 'floor-1',
  activeFilters: new Set(),
  filterSidebarOpen: true,
  selectedUnitId: null,
  scale: 1,
  panX: 0,
  panY: 0,
  smoothTransition: 0,
  tooltip: { visible: false, unitId: '', x: 0, y: 0 },

  loadFacilities: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/data/facilities.json')
      const data: FacilityManifestEntry[] = await res.json()
      set({ facilities: data, loading: false })
    } catch {
      set({ error: 'Failed to load facilities', loading: false })
    }
  },

  selectFacility: async (id: string) => {
    const { facilities } = get()
    const entry = facilities.find(f => f.id === id)
    if (!entry || !entry.hasMap) return
    set({ loading: true })
    try {
      const res = await fetch(entry.dataUrl)
      const data: Facility = await res.json()
      set({
        currentFacility: data,
        currentFloorId: data.floors[0]?.id || 'floor-1',
        loading: false,
        appPhase: 'map',
      })
    } catch {
      set({ error: 'Failed to load facility data', loading: false })
    }
  },

  goToLanding: () => set({
    appPhase: 'landing',
    currentFacility: null,
    selectedUnitId: null,
    activeFilters: new Set(),
    filterSidebarOpen: true,
  }),

  switchFloor: (floorId: string) => {
    set({ currentFloorId: floorId, smoothTransition: 450 })
    // Reset view when switching floors
    const state = get()
    const ww = typeof window !== 'undefined' ? window.innerWidth : 1200
    const wh = typeof window !== 'undefined' ? window.innerHeight - 58 : 800
    const floor = state.currentFacility?.floors.find(f => f.id === floorId)
    if (floor) {
      const mapScale = Math.min(ww / (floor.width + 48), (wh) / (floor.height + 48)) * 0.85
      set({
        scale: mapScale,
        panX: (ww - floor.width * mapScale) / 2,
        panY: (wh - floor.height * mapScale) / 2 + 29,
        smoothTransition: 450,
      })
    }
  },

  toggleFilter: (type: UnitType) => {
    const filters = new Set(get().activeFilters)
    if (filters.has(type)) filters.delete(type)
    else filters.add(type)
    set({ activeFilters: filters })
  },

  clearFilters: () => set({ activeFilters: new Set() }),

  toggleFilterSidebar: () => set(s => ({ filterSidebarOpen: !s.filterSidebarOpen })),

  selectUnit: (id: string) => set({ selectedUnitId: id, appPhase: 'checkout' }),

  deselectUnit: () => set({ selectedUnitId: null, appPhase: 'map' }),

  setViewport: (scale, panX, panY) => set({ scale, panX, panY, smoothTransition: 0 }),

  zoomBy: (delta: number) => {
    const { scale, panX, panY } = get()
    // Multiplicative zoom centered on viewport middle
    const factor = delta > 0 ? 1.25 : 0.8
    const next = Math.max(0.05, Math.min(2.5, scale * factor))
    const ww = typeof window !== 'undefined' ? window.innerWidth : 1200
    const wh = typeof window !== 'undefined' ? window.innerHeight - 58 : 800
    const cx = ww / 2
    const cy = wh / 2
    const newPanX = cx - (cx - panX) * (next / scale)
    const newPanY = cy - (cy - panY) * (next / scale)
    set({ scale: next, panX: newPanX, panY: newPanY, smoothTransition: 350 })
  },

  resetView: () => {
    const state = get()
    const ww = typeof window !== 'undefined' ? window.innerWidth : 1200
    const wh = typeof window !== 'undefined' ? window.innerHeight - 58 : 800
    const floor = state.currentFacility?.floors.find(f => f.id === state.currentFloorId)
    if (floor) {
      const mapScale = Math.min(ww / (floor.width + 48), (wh) / (floor.height + 48)) * 0.85
      set({
        scale: mapScale,
        panX: (ww - floor.width * mapScale) / 2,
        panY: (wh - floor.height * mapScale) / 2 + 29,
        smoothTransition: 450,
      })
    }
  },

  showTooltip: (unitId, x, y) => set({ tooltip: { visible: true, unitId, x, y } }),
  moveTooltip: (x, y) => set(s => ({ tooltip: { ...s.tooltip, x, y } })),
  hideTooltip: () => set(s => ({ tooltip: { ...s.tooltip, visible: false } })),
  goToMap: () => set({ appPhase: 'map', selectedUnitId: null }),
}))
