import { useRef, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import LandingNav from './LandingNav'
import HeroSection from './HeroSection'
import ValueProps from './ValueProps'
import LocationMap from './LocationMap'
import LocationGrid from './LocationGrid'
import StorageTypes from './StorageTypes'
import LandingFooter from './LandingFooter'

export default function LandingPage() {
  const loadFacilities = useFacilityStore(s => s.loadFacilities)
  const locationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFacilities()
  }, [loadFacilities])

  const scrollToLocations = () => {
    locationsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ paddingTop: 58 }}>
      <LandingNav onCta={scrollToLocations} />
      <HeroSection onCta={scrollToLocations} />
      <ValueProps />
      <div ref={locationsRef}>
        <LocationMap />
      </div>
      <LocationGrid />
      <StorageTypes />
      <LandingFooter onCta={scrollToLocations} />
    </div>
  )
}
