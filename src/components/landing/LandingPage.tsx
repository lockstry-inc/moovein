import { useRef, useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import { useTheme } from '../../hooks/useTheme'
import LandingNav from './LandingNav'
import HeroSection from './HeroSection'
import HowItWorks from './HowItWorks'
import LocationMap from './LocationMap'
import LocationGrid from './LocationGrid'
import StorageTypes from './StorageTypes'
import WhyMooveIn from './WhyMooveIn'
import FAQ from './FAQ'
import LandingFooter from './LandingFooter'

export default function LandingPage() {
  const loadFacilities = useFacilityStore(s => s.loadFacilities)
  const locationsRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    loadFacilities()
  }, [loadFacilities])

  const scrollToLocations = () => {
    locationsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ paddingTop: 58 }}>
      <LandingNav onCta={scrollToLocations} theme={theme} onToggleTheme={toggleTheme} />
      <HeroSection onCta={scrollToLocations} theme={theme} />
      <HowItWorks />
      <div ref={locationsRef}>
        <LocationMap theme={theme} />
      </div>
      <LocationGrid />
      <StorageTypes />
      <WhyMooveIn />
      <FAQ />
      <LandingFooter onCta={scrollToLocations} />
    </div>
  )
}
