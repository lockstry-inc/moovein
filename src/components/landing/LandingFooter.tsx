export default function LandingFooter({ onCta }: { onCta: () => void }) {
  return (
    <footer className="border-t border-border px-6" style={{ background: 'var(--color-surface)', padding: '48px 24px 32px' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Top row */}
        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Brand */}
          <div className="flex items-baseline gap-2">
            <span className="font-['Playfair_Display',serif] text-[17px] font-bold text-text">
              Moove In
            </span>
            <span className="text-[11px] font-semibold text-text-dim tracking-[2px] uppercase">
              Self Storage
            </span>
          </div>

          <div className="text-[12px] text-text-dim font-medium text-center">
            No deposit &middot; Cancel anytime &middot; Online reservations
          </div>

          {/* CTA */}
          <button
            onClick={onCta}
            className="bg-brand text-white text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(143,0,0,0.35)]"
            style={{ padding: '10px 24px' }}
          >
            Find a Location
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border mb-6" />

        {/* Copyright */}
        <div className="text-[11px] text-text-dim text-center">
          &copy; {new Date().getFullYear()} Moove In Self Storage. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
