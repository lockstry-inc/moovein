import { useCheckoutStore } from '../../../stores/checkoutStore'
import { ADDONS } from '../../../data/addons'

export default function StepAddons() {
  const selectedAddons = useCheckoutStore(s => s.selectedAddons)
  const toggleAddon = useCheckoutStore(s => s.toggleAddon)

  return (
    <div style={{ padding: '22px 20px' }}>
      <div className="text-[10px] font-semibold text-text-dim tracking-[0.8px] uppercase mb-[10px]">Protection & Add-ons</div>

      {ADDONS.map(addon => {
        const isOn = selectedAddons.has(addon.id)
        return (
          <div
            key={addon.id}
            onClick={() => toggleAddon(addon.id)}
            style={{ padding: '12px 13px' }}
            className={`flex items-center justify-between rounded-[10px] cursor-pointer transition-all duration-200 mb-[6px] border-[1.5px] ${
              isOn
                ? 'bg-accent-bg border-accent'
                : 'bg-surface-2 border-border hover:bg-surface-3 hover:border-border-light'
            }`}
          >
            <div className="flex items-center gap-[10px]">
              <span className="text-[15px]">{addon.icon}</span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-white">{addon.name}</span>
                <span className="text-[11px] text-text-sec">{addon.description}</span>
              </div>
            </div>
            <div className="flex items-center gap-[9px]">
              <span className="text-[12px] font-semibold text-text">
                {addon.monthlyPrice ? `+$${addon.monthlyPrice}/mo` : `$${addon.oneTimePrice} once`}
              </span>
              <div className={`w-9 h-5 rounded-[10px] relative transition-colors duration-250 shrink-0 ${isOn ? 'bg-accent' : 'bg-surface-3'}`}>
                <div className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform duration-250 ${isOn ? 'translate-x-4' : ''}`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
