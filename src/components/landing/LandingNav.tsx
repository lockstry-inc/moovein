export default function LandingNav({ onCta }: { onCta: () => void }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 h-[58px] bg-[rgba(6,7,10,0.92)] backdrop-blur-[24px] border-b border-border flex items-center justify-between z-100"
      style={{ padding: '0 24px 0 20px' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[10px] shrink-0 overflow-hidden"
          style={{ background: '#0e1014' }}
        >
          <img
            src="/moovein.png"
            alt="Moove In"
            className="w-full h-full object-cover"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
        <span className="font-['Playfair_Display',serif] text-[17px] font-semibold text-white">
          Moove In
        </span>
      </div>

      <button
        onClick={onCta}
        className="bg-accent text-bg text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(45,212,160,0.25)] hover:scale-[1.02]"
        style={{ padding: '8px 20px' }}
      >
        Find a Location
      </button>
    </nav>
  )
}
