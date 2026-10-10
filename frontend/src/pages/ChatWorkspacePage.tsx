import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Mic,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, TeachingMode, Citation, VisualSpec } from '../types'
import { VisualTeachingCanvas } from '../components/VisualTeachingCanvas'
import { CitationViewer } from '../components/CitationViewer'

interface ChatWorkspacePageProps {
  messages: Message[]
  isSending: boolean
  error: string
  mode: TeachingMode
  onSetMode: (mode: TeachingMode) => void
  onSendMessage: (text: string) => void
  onRetryLast: () => void
}

export const ChatWorkspacePage: React.FC<ChatWorkspacePageProps> = ({
  messages,
  isSending,
  error,
  mode,
  onSetMode,
  onSendMessage,
  onRetryLast
}) => {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  // Browser Speech Synthesis
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleaned = text.replace(/[#*_`$]/g, '').slice(0, 700)
      const utterance = new SpeechSynthesisUtterance(cleaned)
      utterance.lang = 'en-IN'
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Browser Speech Recognition (Web Speech API)
  const handleToggleMic = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your message.')
      return
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-IN'
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('')
        setInputText(transcript)
      }
      rec.onend = () => setIsListening(false)
      rec.onerror = () => setIsListening(false)
      recognitionRef.current = rec
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || isSending) return
    onSendMessage(trimmed)
    setInputText('')
  }

  const followUpPrompts = [
    'Can you give another real-world analogy?',
    'Show me an interactive code demonstration',
    'Test my understanding with a diagnostic question',
    'Explain this in Telugu'
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Mode Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles size={16} />
          </span>
          <div>
            <span className="text-xs font-bold text-slate-800">Teaching Mode:</span>
            <span className="text-xs text-slate-500 ml-1.5">
              {mode === 'friend' ? 'Warm analogies & bilingual peer explanations' :
               mode === 'teacher' ? 'Structured principles, definitions & check questions' :
               'Hands-on interactive challenge micro-tasks'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['friend', 'teacher', 'doing'] as const).map(m => (
            <button
              key={m}
              onClick={() => onSetMode(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {m === 'friend' ? 'Friend Mode' : m === 'teacher' ? 'Teacher Mode' : 'Learn by Doing'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-2xl p-4.5 text-sm shadow-xs border ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-xs'
                  : 'bg-white text-slate-800 border-slate-200 rounded-bl-xs'
              }`}
            >
              {/* Markdown Content */}
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white prose-invert' : 'text-slate-800'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Visual Teaching Canvas Specification */}
              {msg.visual_spec && (
                <div className="mt-3">
                  <VisualTeachingCanvas
                    spec={msg.visual_spec}
                    onSpeakStep={text => handleSpeak(text)}
                  />
                </div>
              )}

              {/* Citations Bar */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Grounded Citations:
                  </span>
                  {msg.citations.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedCitation(c)}
                      className="px-2 py-0.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded text-[11px] text-slate-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <span>{c.document_name}</span>
                      <span className="font-mono text-indigo-600 font-bold">p.{c.page}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* LangGraph Truthful Event Stepper */}
              {msg.events && msg.events.length > 0 && msg.role === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {msg.events.map((e, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      {e.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Assistant Voice Playback Control */}
              {msg.role === 'assistant' && (
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <button
                    onClick={() => isSpeaking ? handleStopSpeaking() : handleSpeak(msg.content)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={14} className="text-rose-500" /> Stop Speaking
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} /> Listen to Lesson
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 w-max shadow-xs text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="font-medium">LearnPilot Agentic Engine reasoning & preparing lesson...</span>
          </div>
        )}

        {/* Error Banner with Retry */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={onRetryLast}
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 ml-3 shrink-0"
            >
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle size={12} /> Follow-up:
        </span>
        {followUpPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(p)}
            className="text-xs bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Composer Area */}
      <div className="bg-white border border-slate-300 rounded-2xl p-2.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <textarea
          rows={2}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Ask a question, upload a topic, or say 'Explain in Telugu'..."
          className="w-full resize-none border-0 text-xs sm:text-sm text-slate-800 focus:outline-hidden px-1"
        />
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="Voice Input (Speech-to-Text)"
            >
              {isListening ? <Square size={15} /> : <Mic size={15} />}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-all"
            >
              Send <Send size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      <CitationViewer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  )
}

