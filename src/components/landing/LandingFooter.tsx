export default function LandingFooter({ onCta }: { onCta: () => void }) {
  return (
    <footer className="border-t border-border" style={{ background: 'var(--color-surface)', padding: '40px 24px 28px' }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[8px] shrink-0 overflow-hidden"
              style={{ background: '#0e1014' }}
            >
              <img
                src="/moovein.png"
                alt="Moove In"
                className="w-full h-full object-cover"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
            <span className="font-['Playfair_Display',serif] text-[15px] font-semibold text-white">
              Moove In
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={onCta}
            className="bg-accent text-bg text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(45,212,160,0.25)]"
            style={{ padding: '10px 24px' }}
          >
            Find a Location
          </button>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-[12px] text-text-dim font-medium">
            No deposit &middot; Cancel anytime &middot; Online reservations
          </div>
          <div className="text-[11px] text-text-dim">
            &copy; {new Date().getFullYear()} Moove In Self Storage. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
