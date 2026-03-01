import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, GithubLogo, Globe } from '@phosphor-icons/react'

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const TEAM = [
  {
    name: 'Dino Gomez',
    role: '',
    bio: 'Building and breaking things responsibly from the Philippines.',
    website: 'https://dinogomez.app/',
    github: 'https://github.com/dinogomez',
    x: 'https://x.com/dinogomez',
    linkedin: 'https://www.linkedin.com/in/paulgomez-dev/',
  },
]

export default function About() {
  useEffect(() => { document.title = 'About — Cadence' }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
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

      <main id="main-content">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">About Cadence</p>
          <h1 className="text-4xl font-semibold text-gray-900 leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
            Built for the people who keep the world's support lines running.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            The Philippines is the global capital of customer support. Over 1.3 million Filipinos work in BPO — handling calls for banks, telecoms, airlines, and retailers across the world. They are patient, skilled, and often underestimated.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="border-t border-gray-100 my-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Story */}
        <motion.div
          className="space-y-5 text-gray-600 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <p>
            I knew a lot of people who went into BPO. Not because it was their dream, but because it paid well and it supported their families. Night shifts, accents, and varied customers. Training that was mostly classroom slides and role-plays with a supervisor watching over their shoulder. There was no safe space to make mistakes.
          </p>
          <p>
            Cadence is that safe space. An AI customer who actually escalates when you deflect. A coaching layer that tells you what you missed in real time. A scorecard that measures what a customer support manager actually cares about: not just whether you were polite, but whether you resolved the issue, stayed compliant, and kept a situation from blowing up.
          </p>
          <p>
            I built this for the Mistral Hackathon 2026, powered by Voxtral for speech-to-text and ElevenLabs for voice. The reason is simple: the BPO industry deserves better training tools, and I had a weekend to build one.
          </p>
          <p className="text-gray-900 font-medium">
            The best agents aren't born patient. They just practiced more than everyone else.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="border-t border-gray-100 my-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6">TEAM BLUEROCK</p>
          {TEAM.map(person => (
            <div key={person.name} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/ph.svg" alt="Philippines" style={{ width: '40px', height: '30px', objectFit: 'cover' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900">{person.name}</span>
                  {person.role && <span className="text-xs text-gray-400">{person.role}</span>}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{person.bio}</p>
                <div className="flex items-center gap-3">
                  <a href={person.website} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors">
                    <Globe size={15} />
                  </a>
                  <a href={person.github} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors">
                    <GithubLogo size={15} />
                  </a>
                  <a href={person.x} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors">
                    <XIcon />
                  </a>
                  <a href={person.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors">
                    <LinkedinIcon />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          className="border-t border-gray-100 my-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        />

        {/* Stack */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Built with</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Mistral Large', href: 'https://mistral.ai' },
              { label: 'Voxtral', href: 'https://mistral.ai/news/voxtral' },
              { label: 'ElevenLabs', href: 'https://elevenlabs.io' },
              { label: 'React 19', href: 'https://react.dev' },
              { label: 'Hono', href: 'https://hono.dev' },
              { label: 'Mistral Hackathon 2026', href: 'https://worldwide-hackathon.mistral.ai/' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                {label}
              </a>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-md hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
             <ArrowLeft weight="bold" size={14} />Go Back
          </Link>
        </motion.div>

      </div>
      </main>
    </div>
  )
}
