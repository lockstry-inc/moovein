import { useEffect } from 'react'
import { useFacilityStore } from './stores/facilityStore'
import { useIsDesktop } from './hooks/useMediaQuery'
import Topbar from './components/layout/Topbar'
import IntroOverlay from './components/layout/IntroOverlay'
import FacilityMap from './components/map/FacilityMap'
import FilterSidebar from './components/map/FilterSidebar'
import MapLegend from './components/map/MapLegend'
import MapStats from './components/map/MapStats'
import MapControls from './components/map/MapControls'
import FloorSwitcher from './components/map/FloorSwitcher'
import UnitTooltip from './components/map/UnitTooltip'
import CheckoutPanel from './components/checkout/CheckoutPanel'
import UnitCardList from './components/mobile/UnitCardList'
import FilterChips from './components/mobile/FilterChips'

export default function App() {
  const appPhase = useFacilityStore(s => s.appPhase)
  const isDesktop = useIsDesktop()
  const loadFacilities = useFacilityStore(s => s.loadFacilities)

  useEffect(() => {
    loadFacilities()
  }, [loadFacilities])

  return (
    <>
      <Topbar />
      {isDesktop ? <FacilityMap /> : <UnitCardList />}
      {appPhase === 'intro' && <IntroOverlay />}
      {appPhase === 'checkout' && <CheckoutPanel />}
      {isDesktop && appPhase !== 'intro' && (
        <>
          <FilterSidebar />
          <MapLegend />
          <MapStats />
          <div className="fixed bottom-[22px] right-[22px] flex flex-col items-end gap-[10px] z-90">
            <FloorSwitcher />
            <MapControls />
          </div>
          <UnitTooltip />
        </>
      )}
      {!isDesktop && appPhase !== 'intro' && (
        <>
          <FilterChips />
          <FloorSwitcher />
        </>
      )}
    </>
  )
}
