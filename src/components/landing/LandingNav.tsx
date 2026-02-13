interface Props {
  onCta: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export default function LandingNav({ onCta, theme, onToggleTheme }: Props) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 h-[58px] backdrop-blur-[24px] border-b border-border flex items-center justify-between z-100"
      style={{
        padding: '0 24px 0 20px',
        background: theme === 'dark' ? 'rgba(6,7,10,0.92)' : 'rgba(245,245,247,0.92)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-['Playfair_Display',serif] text-[19px] font-bold text-text tracking-[-0.3px]">
          Moove In
        </span>
        <span className="text-[11px] font-semibold text-text-dim tracking-[0.5px] uppercase hidden sm:inline">
          Self Storage
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border border-border bg-surface transition-all duration-200 hover:border-border-light"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-[16px]">
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </span>
        </button>

        <button
          onClick={onCta}
          className="bg-brand text-white text-[13px] font-semibold rounded-full cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(143,0,0,0.35)] hover:scale-[1.02]"
          style={{ padding: '8px 20px' }}
        >
          Find a Location
        </button>
      </div>
    </nav>
  )
}
