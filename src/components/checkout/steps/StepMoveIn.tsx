import { useMemo } from 'react'
import { useCheckoutStore } from '../../../stores/checkoutStore'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function StepMoveIn() {
  const selectedDate = useCheckoutStore(s => s.selectedDate)
  const setSelectedDate = useCheckoutStore(s => s.setSelectedDate)

  const dates = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i + 1)
      const label = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
      return label
    })
  }, [])

  return (
    <div className="p-[22px_20px]">
      <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[10px]">Select Move-in Date</div>
      <div className="flex flex-wrap gap-[6px]">
        {dates.map(date => {
          const isSelected = selectedDate === date
          return (
            <div
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`py-[9px] px-[14px] rounded-[10px] text-[12px] font-medium cursor-pointer transition-all duration-200 border-[1.5px] ${
                isSelected
                  ? 'bg-accent-bg border-accent text-accent'
                  : 'bg-surface-2 border-border text-text hover:border-border-light'
              }`}
            >
              {date}
            </div>
          )
        })}
      </div>
    </div>
  )
}
