const PROPS = [
  { icon: '\u2714', title: 'No Deposit', desc: 'Move in without upfront costs. Just your first month.' },
  { icon: '\u21BB', title: 'Cancel Anytime', desc: 'Month-to-month flexibility. No long-term commitments.' },
  { icon: '\uD83D\uDCF1', title: 'Online Reservations', desc: 'Reserve your unit instantly from any device.' },
  { icon: '\uD83D\uDD12', title: '24/7 Access', desc: 'Smart lock-enabled units for round-the-clock entry at your convenience.' },
]

export default function ValueProps() {
  return (
    <section className="py-20 px-6" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROPS.map(p => (
          <div
            key={p.title}
            className="bg-surface border border-border rounded-[14px] flex flex-col items-center text-center transition-all duration-200 hover:border-border-light"
            style={{ padding: '24px 16px' }}
          >
            <div className="w-10 h-10 rounded-[10px] bg-brand-bg flex items-center justify-center text-[18px] mb-3">
              {p.icon}
            </div>
            <div className="text-[14px] font-semibold text-text mb-1">{p.title}</div>
            <div className="text-[12px] text-text-sec leading-[1.5]">{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
