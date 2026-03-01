import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Orb } from '@/components/ui/orb'
import { GithubLogo, ArrowRight, LinkedinLogo, Globe } from '@phosphor-icons/react'

const ARC_ORBS: { colors: [string, string]; agentState: 'talking' | 'thinking' | 'listening'; seed: number; offset: { x: number; y: number }; size: number; z: number }[] = [
  { colors: ['#818CF8', '#4F46E5'], agentState: 'talking',   seed: 1, offset: { x: -110, y: 20 }, size: 120, z: 1 },
  { colors: ['#34D399', '#059669'], agentState: 'listening', seed: 2, offset: { x: 0,    y: 0  }, size: 152, z: 2 },
  { colors: ['#FB923C', '#EA580C'], agentState: 'thinking',  seed: 3, offset: { x: 110,  y: 20 }, size: 120, z: 1 },
]

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const FEATURES = [
  { num: '01', label: 'Reactive escalation', desc: 'Customer mood shifts based on every word you say. Deflect and they get angrier.' },
  { num: '02', label: 'Live coaching',        desc: 'Per-turn flags and tips appear instantly as you practice. Learn in real time.' },
  { num: '03', label: 'Detailed scorecard',   desc: 'Empathy, English, compliance, and resolution — scored and reviewed every call.' },
]

export default function Landing() {
  useEffect(() => { document.title = 'Cadence — AI Customer Support Training' }, [])

  return (
    <div className="bg-white">
      {/* Skip link for keyboard/screen reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-md focus:text-sm">
        Skip to main content
      </a>

      {/* Nav — sticky */}
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.webp" alt="Cadence" className="h-8 w-auto" />
          </Link>
          <Link
            to="/practice"
            className="flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Start Practice <ArrowRight weight="bold" size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero — full viewport height */}
      <main id="main-content">
      <section className="h-[calc(100vh-56px)] flex flex-col justify-center w-full overflow-hidden">
        <div className="max-w-4xl mx-auto w-full px-6">

          {/* Big hero text */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-center mb-4">
              <motion.a
                href="https://worldwide-hackathon.mistral.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{ color: '#e35a29', borderColor: '#e35a29', backgroundColor: '#fff7f4' }}
                whileHover={{ scale: 1.05, backgroundColor: '#e35a29', color: '#fff' }}
                transition={{ duration: 0.15 }}
              >
                Mistral Hackathon 2026
              </motion.a>
            </div>
            <h1 className="font-medium" style={{ fontSize: '10rem', letterSpacing: '-0.03em', lineHeight: 1 }} aria-label="Cadence — AI-powered customer support training">
              Cadence
            </h1>
          </motion.div>

          {/* Arc orbs */}
          <div className="flex justify-center mb-8" style={{ height: '160px' }}>
            <div className="relative" style={{ width: '380px', height: '160px' }}>
              {ARC_ORBS.map((orb, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: orb.size,
                    height: orb.size,
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${orb.offset.x}px), calc(-50% + ${orb.offset.y}px))`,
                    zIndex: orb.z,
                  }}
                >
                  <motion.div
                    className="w-full h-full"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Orb colors={orb.colors} agentState={orb.agentState} seed={orb.seed} className="w-full h-full" />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          <motion.p
            className="text-lg text-gray-400 mx-auto text-center whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Practice customer support calls with AI. Get better and confident!
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.95 }}
          >
            
            <Link
              to="/about"
              className="flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-md border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              Learn More
            </Link>
            <Link
              to="/practice"
              className="flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features section — dark, full width, scroll into view */}
      <section className="bg-gray-950 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-gray-500 text-xs tracking-widest uppercase mb-4">OUR ADVANTAGE</p>
            <h2 className="text-white font-semibold mb-16" style={{ fontSize: '3.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Why <em className="italic font-semibold">Cadence?</em>
            </h2>
          </motion.div>

          {/* Row list */}
          <div className="divide-y divide-gray-800">
            {FEATURES.map(({ num, label, desc }, i) => (
              <motion.div
                key={num}
                className="flex items-start gap-10 py-8"
                initial={{ opacity: 0, x: -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-gray-600 text-2xl font-light w-10 flex-shrink-0 mt-0.5">{num}</span>
                <div>
                  <div className="text-white text-base font-semibold mb-1">{label}</div>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 overflow-hidden">
        <div className="w-fit mx-auto pt-8 pb-6">
          {/* Icons row */}
          <motion.div
            className="flex items-center justify-between pb-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-gray-600 text-xs font-medium tracking-widest uppercase ml-2 flex items-center gap-1.5">
              <span className="rounded-sm overflow-hidden flex-shrink-0 inline-block" style={{ width: '20px', height: '14px' }}>
                <img src="/ph.svg" alt="Philippines" className="w-4 h-4 flex-shrink-0" />
              </span> dinogomez
            </span>
            <div className="flex items-center gap-3">
              <a href="https://dinogomez.app/" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <Globe size={16} />
              </a>
              <a href="https://github.com/dinogomez" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <GithubLogo size={16} />
              </a>
              <a href="https://x.com/dinogomez" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <XIcon />
              </a>
              <a href="https://www.linkedin.com/in/paulgomez-dev/" target="_blank" rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <LinkedinLogo size={16} />
              </a>
            </div>
          </motion.div>

          {/* BLUEROCK */}
          <motion.p
            className="font-bold select-none whitespace-nowrap leading-none pointer-events-none"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: '11rem',
              letterSpacing: '-0.04em',
              lineHeight: 0.82,
              color: 'white',
            }}
          >
            BLUEROCK
          </motion.p>
        </div>
      </footer>
    </div>
  )
}
