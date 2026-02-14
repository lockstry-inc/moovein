import { useState, useRef } from 'react'
import { useInView } from '../../hooks/useInView'

const QUESTIONS = [
  {
    q: 'How much does a storage unit cost?',
    a: 'Prices start at $49/month for a compact 5\u2019\u00d75\u2019 unit and go up to $399/month for our largest 10\u2019\u00d740\u2019 spaces. The exact price depends on unit size, location, and features like climate control.',
  },
  {
    q: 'What are your access hours?',
    a: 'Most Moove In facilities offer 24/7 access through smart lock-enabled gates and units. Check your specific location for any holiday exceptions.',
  },
  {
    q: 'What can I store in my unit?',
    a: 'Household furniture, business inventory, seasonal items, vehicles, and more. We prohibit hazardous materials, perishable food, live animals, and anything illegal. Full details are in the rental agreement.',
  },
  {
    q: 'Do I need insurance for my storage unit?',
    a: 'We offer affordable protection plans starting at $12/month that cover fire, theft, and water damage. You can also use your existing homeowner\u2019s or renter\u2019s insurance if it covers off-site storage.',
  },
  {
    q: 'Can I cancel my reservation?',
    a: 'Absolutely. All rentals are month-to-month with no long-term commitments. You can cancel anytime with no penalty or early termination fees.',
  },
  {
    q: 'How do I reserve a unit online?',
    a: 'Find a location, choose your unit size, and complete the 7-step checkout. The entire process takes under 5 minutes and your unit is reserved immediately \u2014 no deposit needed.',
  },
  {
    q: 'Are climate-controlled units available?',
    a: 'Yes. Many locations offer climate-controlled units that maintain a consistent temperature range, ideal for electronics, documents, artwork, and temperature-sensitive belongings.',
  },
  {
    q: 'What happens on move-in day?',
    a: 'Arrive at your facility, use your access code or smart lock to enter, and start loading your unit. Our team is available on-site or by phone if you need any help.',
  },
]

export default function FAQ() {
  const { ref, inView } = useInView()

  return (
    <section id="faq" className="py-20 px-6 border-t border-border" style={{ background: 'var(--color-surface)' }}>
      <div ref={ref} className="max-w-[700px] mx-auto">
        <h2
          className="font-['Playfair_Display',serif] text-[28px] font-bold text-text text-center mb-2"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Frequently Asked Questions
        </h2>
        <p
          className="text-[14px] text-text-sec text-center mb-10"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 80ms',
          }}
        >
          Everything you need to know before renting
        </p>

        <div>
          {QUESTIONS.map((item, i) => (
            <FAQItem
              key={i}
              question={item.q}
              answer={item.a}
              inView={inView}
              delay={i * 60}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer, inView, delay }: {
  question: string
  answer: string
  inView: boolean
  delay: number
}) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="border-b border-border"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(16px)',
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left bg-transparent border-none cursor-pointer group"
        style={{ padding: '16px 0' }}
      >
        <span className="text-[15px] font-semibold text-text transition-colors duration-200 group-hover:text-brand pr-4">
          {question}
        </span>
        <span
          className="text-[18px] text-text-dim shrink-0 transition-transform duration-350"
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          height: open ? contentRef.current?.scrollHeight ?? 0 : 0,
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div ref={contentRef} style={{ paddingBottom: 16 }}>
          <p className="text-[13px] text-text-sec leading-[1.7]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}
