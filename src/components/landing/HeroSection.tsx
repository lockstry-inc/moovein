import PointCloudCow from './PointCloudCow'

interface Props {
  onCta: () => void
  theme: 'dark' | 'light'
}

export default function HeroSection({ onCta, theme }: Props) {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(143, 0, 0, 0.06) 0%, transparent 60%), var(--color-bg)',
      }}
    >
      {/* 3D Point Cloud Cow */}
      <PointCloudCow theme={theme} />

      {/* Heading */}
      <h1 className="font-['Playfair_Display',serif] text-[48px] md:text-[64px] font-bold text-text mb-3 text-center">
        Moove In
      </h1>

      {/* Tagline */}
      <p className="text-[18px] text-text-sec mb-2 text-center">
        Self storage, reimagined.
      </p>
      <p className="text-[14px] text-text-dim mb-10 text-center">
        31 locations across the Northeast &amp; Mid-Atlantic
      </p>

      {/* CTA */}
      <button
        onClick={onCta}
        className="bg-brand text-white font-semibold text-[15px] rounded-full cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(143,0,0,0.4)] hover:scale-[1.03] active:scale-[0.98]"
        style={{ padding: '14px 36px' }}
      >
        Find Your Location
      </button>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 text-text-dim">
        <span className="text-[11px] font-medium tracking-[0.5px] uppercase">Scroll</span>
        <div className="w-px h-6 bg-border" />
      </div>
    </section>
  )
}
