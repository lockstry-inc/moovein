import { useCheckoutStore } from '../../stores/checkoutStore'

interface Props {
  unitPrice: number
  unitLabel: string
}

export default function OrderSummary({ unitPrice, unitLabel }: Props) {
  const computeTotal = useCheckoutStore(s => s.computeTotal)
  const { monthly, oneTime, items } = computeTotal(unitPrice)

  let totalStr = `$${monthly}/mo`
  if (oneTime) totalStr += ` + $${oneTime}`

  return (
    <div className="bg-surface-2 border border-border rounded-[14px] mb-3" style={{ padding: 14 }}>
      <div className="flex justify-between py-[5px] text-[12px]">
        <span className="text-text-sec">{unitLabel}</span>
        <span className="text-text font-semibold">${unitPrice}/mo</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between py-[5px] text-[12px]">
          <span className="text-text-sec">{item.label}</span>
          <span className="text-text font-semibold">{item.amount}</span>
        </div>
      ))}
      <div className="flex justify-between pt-[10px] mt-[5px] border-t border-border">
        <span className="text-text font-semibold text-[12px]">Due today</span>
        <span className="text-white font-bold text-[16px]">{totalStr}</span>
      </div>
    </div>
  )
}
