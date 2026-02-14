import { useInView } from '../../hooks/useInView'

const FEATURES = [
  {
    title: 'No Deposit',
    desc: 'Move in without upfront costs. Just your first month\u2019s rent.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
    ),
  },
  {
    title: 'Cancel Anytime',
    desc: 'Month-to-month flexibility with no long-term commitments.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
  {
    title: '24/7 Access',
    desc: 'Smart lock-enabled units for round-the-clock entry.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'HD Surveillance',
    desc: 'Every facility monitored with high-definition security cameras.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: 'Climate Control',
    desc: 'Temperature-regulated units available to protect sensitive items.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    ),
  },
  {
    title: 'Easy Online Rental',
    desc: 'Reserve and manage your unit entirely from your phone.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
]

export default function WhyMooveIn() {
  const { ref, inView } = useInView()

  return (
    <section className="py-20 px-6" style={{ background: 'var(--color-bg)' }}>
      <div ref={ref} className="max-w-[900px] mx-auto">
        <h2 className="font-['Playfair_Display',serif] text-[28px] font-bold text-text text-center mb-2">
          Why Moove In
        </h2>
        <p className="text-[14px] text-text-sec text-center mb-10">
          Built around convenience, security, and flexibility
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-[14px] transition-all duration-200 hover:border-border-light"
              style={{
                padding: '22px 18px',
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms`,
              }}
            >
              <div className="w-10 h-10 rounded-[10px] bg-brand-bg flex items-center justify-center text-brand mb-3">
                {f.icon}
              </div>
              <div className="text-[14px] font-semibold text-text mb-1">{f.title}</div>
              <div className="text-[12px] text-text-sec leading-[1.5]">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
