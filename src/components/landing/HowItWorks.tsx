import { useInView } from '../../hooks/useInView'

const STEPS = [
  {
    num: '01',
    title: 'Search',
    desc: 'Browse locations near you and compare unit sizes and prices.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Reserve',
    desc: 'Lock in your unit online instantly. No deposit required.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Move In',
    desc: 'Show up on your move-in date. We handle the rest.',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  const { ref, inView } = useInView()

  return (
    <section className="py-20 px-6" style={{ background: 'var(--color-bg)' }}>
      <div ref={ref} className="max-w-[900px] mx-auto">
        <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-text text-center mb-2">
          How It Works
        </h2>
        <p className="text-[14px] text-text-sec text-center mb-12">
          Three steps to secure storage
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[28px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-border" />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="flex flex-col items-center text-center"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 120}ms`,
              }}
            >
              <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-brand mb-4 relative z-10">
                {step.icon}
              </div>
              <div className="text-[11px] font-bold text-brand tracking-[1.5px] uppercase mb-2">
                {step.num}
              </div>
              <div className="text-[16px] font-semibold text-text mb-2">
                {step.title}
              </div>
              <div className="text-[13px] text-text-sec leading-[1.6] max-w-[240px]">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
