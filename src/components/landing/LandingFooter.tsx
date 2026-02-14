export default function LandingFooter({ onCta }: { onCta: () => void }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-border px-6" style={{ background: 'var(--color-surface)', padding: '48px 24px 32px' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-['Playfair_Display',serif] text-[17px] font-bold text-text">
                Moove In
              </span>
              <span className="text-[11px] font-semibold text-text-dim tracking-[2px] uppercase">
                Self Storage
              </span>
            </div>
            <p className="text-[12px] text-text-sec leading-[1.6] mb-4">
              Modern self-storage across 27+ locations. No deposit, no hassle, just space when you need it.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              <SocialIcon label="Facebook">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </SocialIcon>
              <SocialIcon label="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </SocialIcon>
              <SocialIcon label="X">
                <path d="M4 4l11.733 16h4.267l-11.733-16zm3.733 0l8.267 16m-4-16l-8.267 16" />
              </SocialIcon>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-[12px] font-semibold text-text uppercase tracking-[1.5px] mb-4">Quick Links</div>
            <div className="flex flex-col gap-[10px]">
              <FooterLink onClick={onCta}>Find a Location</FooterLink>
              <FooterLink onClick={() => scrollTo('storage-sizes')}>Storage Sizes</FooterLink>
              <FooterLink onClick={() => scrollTo('faq')}>FAQ</FooterLink>
              <FooterLink>Contact Us</FooterLink>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[12px] font-semibold text-text uppercase tracking-[1.5px] mb-4">Contact</div>
            <div className="flex flex-col gap-[10px]">
              <span className="text-[13px] text-text-sec">(888) 555-MOOV</span>
              <span className="text-[13px] text-text-sec">support@moovein.com</span>
              <span className="text-[13px] text-text-sec">Mon–Sat 9am–6pm EST</span>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[12px] font-semibold text-text uppercase tracking-[1.5px] mb-4">Legal</div>
            <div className="flex flex-col gap-[10px]">
              <FooterLink>Privacy Policy</FooterLink>
              <FooterLink>Terms of Service</FooterLink>
              <FooterLink>Accessibility</FooterLink>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-text-dim">
            &copy; {new Date().getFullYear()} Moove In Self Storage. All rights reserved.
          </div>
          <button
            onClick={onCta}
            className="bg-brand text-white text-[12px] font-semibold rounded-full cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(143,0,0,0.35)]"
            style={{ padding: '8px 20px' }}
          >
            Find a Location
          </button>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-[13px] text-text-sec bg-transparent border-none cursor-pointer text-left font-['DM_Sans',sans-serif] transition-colors duration-200 hover:text-brand p-0"
    >
      {children}
    </button>
  )
}

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="w-8 h-8 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center text-text-dim cursor-pointer transition-all duration-200 hover:text-text hover:border-border-light"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}
