import { useEffect } from 'react'
import { useFacilityStore } from './stores/facilityStore'
import { useIsDesktop } from './hooks/useMediaQuery'
import LandingPage from './components/landing/LandingPage'
import Topbar from './components/layout/Topbar'
import FacilityMap from './components/map/FacilityMap'
import FilterSidebar from './components/map/FilterSidebar'
import MapLegend from './components/map/MapLegend'
import MapStats from './components/map/MapStats'
import MapControls from './components/map/MapControls'
import UnitTooltip from './components/map/UnitTooltip'
import CheckoutPanel from './components/checkout/CheckoutPanel'
import UnitCardList from './components/mobile/UnitCardList'
import FilterChips from './components/mobile/FilterChips'
import FloorSwitcher from './components/map/FloorSwitcher'

export default function App() {
  const appPhase = useFacilityStore(s => s.appPhase)
  const isDesktop = useIsDesktop()

  // Toggle body overflow based on phase
  useEffect(() => {
    if (appPhase === 'landing') {
      document.body.classList.remove('map-active')
    } else {
      document.body.classList.add('map-active')
    }
  }, [appPhase])

  if (appPhase === 'landing') {
    return <LandingPage />
  }

  return (
    <>
      <Topbar />
      {isDesktop ? <FacilityMap /> : <UnitCardList />}
      {appPhase === 'checkout' && <CheckoutPanel />}
      {isDesktop && appPhase === 'map' && (
        <>
          <FilterSidebar />
          <MapLegend />
          <MapStats />
          <MapControls />
          <UnitTooltip />
        </>
      )}
      {!isDesktop && appPhase === 'map' && (
        <>
          <FilterChips />
          <FloorSwitcher />
        </>
      )}
    </>
  )
}
