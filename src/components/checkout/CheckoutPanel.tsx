import { useEffect } from 'react'
import { useFacilityStore } from '../../stores/facilityStore'
import { useCheckoutStore } from '../../stores/checkoutStore'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import CheckoutProgress from './CheckoutProgress'
import CheckoutFooter from './CheckoutFooter'
import StepUnitDetails from './steps/StepUnitDetails'
import StepAddons from './steps/StepAddons'
import StepLease from './steps/StepLease'
import StepIdentity from './steps/StepIdentity'
import StepMoveIn from './steps/StepMoveIn'
import StepPayment from './steps/StepPayment'
import StepConfirmation from './steps/StepConfirmation'

export default function CheckoutPanel() {
  const deselectUnit = useFacilityStore(s => s.deselectUnit)
  const selectedUnitId = useFacilityStore(s => s.selectedUnitId)
  const facility = useFacilityStore(s => s.currentFacility)
  const currentFloorId = useFacilityStore(s => s.currentFloorId)
  const step = useCheckoutStore(s => s.step)
  const reset = useCheckoutStore(s => s.reset)
  const isDesktop = useIsDesktop()

  const floor = facility?.floors.find(f => f.id === currentFloorId)
  const unit = floor?.units.find(u => u.id === selectedUnitId)

  const handleClose = () => {
    reset()
    deselectUnit()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (!unit) return null

  const stepComponent = {
    1: <StepUnitDetails unit={unit} />,
    2: <StepAddons />,
    3: <StepLease />,
    4: <StepIdentity />,
    5: <StepMoveIn />,
    6: <StepPayment unit={unit} />,
    7: <StepConfirmation unit={unit} />,
  }[step]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 z-200 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed bg-surface z-210 flex flex-col ${
          isDesktop
            ? 'top-0 right-0 w-[400px] max-w-[90vw] h-screen border-l border-border'
            : 'inset-0'
        }`}
        style={{
          animation: isDesktop
            ? 'panelSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'panelSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <CheckoutProgress />
          <button
            onClick={handleClose}
            className="w-[34px] h-[34px] bg-surface-2 border border-border rounded-[9px] text-text-sec text-[16px] cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-surface-3 hover:text-text"
          >
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" key={step}>
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {stepComponent}
          </div>
        </div>

        {/* Footer */}
        {step < 7 && <CheckoutFooter unit={unit} />}
      </div>
    </>
  )
}
