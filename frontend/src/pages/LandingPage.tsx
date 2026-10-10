import React from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Mic,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle,
  HelpCircle,
  Shield,
  Volume2,
  FileText
} from 'lucide-react'

interface LandingPageProps {
  onStart: (initialPrompt?: string) => void
  onOpenAuth: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenAuth }) => {
  const samplePrompts = [
    'Explain SQL joins with interactive table animations',
    'Teach me Python loops step by step with variable tracing',
    'Explain Database Normalization in Telugu with everyday analogies',
    'Prepare me for a DBMS exam in three days'
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles size={19} />
            </span>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">LearnPilot</span>
              <span className="text-indigo-600 font-extrabold ml-1">AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => onStart()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
            >
              Launch Workspace <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-6"
          >
            <Sparkles size={14} /> Autonomous, Voice-First AI Learning Companion
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight"
          >
            Don't Just Learn. <br />
            <span className="text-indigo-600">Get Guided.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-5 leading-relaxed"
          >
            LearnPilot AI reasons across your syllabus, diagnoses conceptual misunderstandings in real time,
            and adapts with voice conversations, grounded document citations, and interactive visual demonstrations.
          </motion.p>

          {/* Interactive Starter Launcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 max-w-2xl mx-auto bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-md text-left"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Try a guided learning objective:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onStart(p)}
                  className="p-3 text-left border border-slate-100 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-200 rounded-xl text-xs text-slate-700 hover:text-indigo-900 transition-all group flex items-start justify-between"
                >
                  <span className="pr-2 leading-relaxed">{p}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-indigo-600 mt-0.5 shrink-0" />
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mic size={14} className="text-indigo-600" /> Voice and text enabled
              </span>
              <button
                onClick={() => onStart()}
                className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                Or ask your custom goal →
              </button>
            </div>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Grounded Architecture for Real Learning</h2>
            <p className="text-sm text-slate-500 mt-2">Not simulated autonomy. A real stateful multi-agent decision system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-max mb-4">
                <Cpu size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Agentic Decision Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by LangGraph and Gemini. The orchestrator inspects the student's mastery level,
                coordinates knowledge retrieval, selects specialist agents, and validates outputs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-max mb-4">
                <Volume2 size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Voice Teaching in 3 Modes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose between Friend Mode (warm analogies & Telugu support), Teacher Mode (structured logic),
                or Learn-by-Doing (interactive micro-challenges with live feedback).
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl w-max mb-4">
                <FileText size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Academic PDF RAG</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload course syllabi and lecture PDFs. PyMuPDF extracts grounded passages, providing
                exact page citations and verified excerpts for every factual claim.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <p>LearnPilot AI · Built with FastAPI, LangGraph, Google Gemini API, and React</p>
      </footer>
    </div>
  )
}

