import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { VoiceWaveVisualizer } from '../components/VoiceWaveVisualizer'
import type { TeachingMode } from '../types'

interface VoiceWorkspacePageProps {
  onSendVoiceQuery: (text: string, mode: TeachingMode) => Promise<string>
}

export const VoiceWorkspacePage: React.FC<VoiceWorkspacePageProps> = ({ onSendVoiceQuery }) => {
  const [mode, setMode] = useState<TeachingMode>('friend')
  const [language, setLanguage] = useState<'en' | 'te'>('en')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastAnswer, setLastAnswer] = useState(
    'Hello! I am your LearnPilot voice companion. Press the microphone button and ask any academic concept.'
  )
  const [loading, setLoading] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)

  const recognitionRef = useRef<any>(null)
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Web Speech Synthesis
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const cleaned = text.replace(/[#*_`$]/g, '').slice(0, 900)
    const utterance = new SpeechSynthesisUtterance(cleaned)
    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN'
    utterance.rate = speechRate

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    synthUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }

  // Web Speech Recognition
  const toggleListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please use text.')
      return
    }

    if (!recognitionRef.current) {
      const rec = new SpeechRec()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = language === 'te' ? 'te-IN' : 'en-IN'

      rec.onresult = (e: any) => {
        const current = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('')
        setTranscript(current)
      }

      rec.onend = async () => {
        setIsListening(false)
        if (transcript.trim()) {
          await submitVoiceQuery(transcript.trim())
        }
      }

      rec.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      stopSpeaking()
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const submitVoiceQuery = async (queryText: string) => {
    setLoading(true)
    try {
      const answer = await onSendVoiceQuery(queryText, mode)
      setLastAnswer(answer)
      speakText(answer)
    } catch (e: any) {
      setLastAnswer('Sorry, I encountered an issue: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const sampleVoicePrompts = [
    { label: 'Explain SQL joins in Telugu', query: 'Explain SQL joins in Telugu with everyday analogies' },
    { label: 'Teach me Python loops simply', query: 'Teach me Python loops with a simple accumulator example' },
    { label: 'Quiz me on DBMS normalization', query: 'Ask me a diagnostic quiz question on 3NF database normalization' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <Mic size={13} /> Voice-First Interactive Companion
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Spoken AI Learning Studio</h2>
          <p className="text-xs text-slate-500">Natural voice reasoning across academic concepts in English & Telugu</p>
        </div>

        {/* Controls: Mode & Language */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['friend', 'teacher', 'doing'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'friend' ? 'Friend' : m === 'teacher' ? 'Teacher' : 'Learn-Doing'}
              </button>
            ))}
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(l => l === 'en' ? 'te' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Languages size={14} className="text-indigo-600" />
            {language === 'en' ? 'English (en-IN)' : 'Telugu (te-IN)'}
          </button>
        </div>
      </div>

      {/* Voice Visualizer Wave Area */}
      <div className="relative">
        <VoiceWaveVisualizer
          isListening={isListening}
          isSpeaking={isSpeaking && !isPaused}
        />

        {/* Floating Voice Playback Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={toggleListening}
            disabled={loading}
            className={`px-5 py-3 rounded-full text-xs font-bold shadow-md flex items-center gap-2 transition-all ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isListening ? (
              <>
                <Square size={16} /> Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} /> Speak Your Question
              </>
            )}
          </button>

          {isSpeaking && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              {isPaused ? (
                <button
                  onClick={resumeSpeaking}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  title="Resume speech"
                >
                  <Play size={16} />
                </button>
              ) : (
                <button
                  onClick={pauseSpeaking}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full"
                  title="Pause speech"
                >
                  <Pause size={16} />
                </button>
              )}
              <button
                onClick={stopSpeaking}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-full"
                title="Stop speech"
              >
                <VolumeX size={16} />
              </button>
            </div>
          )}

          <button
            onClick={() => speakText(lastAnswer)}
            disabled={isSpeaking || loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw size={14} /> Replay Audio
          </button>
        </div>
      </div>

      {/* Transcript & Spoken Lesson Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Input Transcript */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Spoken Student Query
          </span>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-mono text-slate-800 min-h-24">
            {transcript || (isListening ? 'Listening to your microphone...' : 'Press microphone to dictate your prompt...')}
          </div>
          {transcript && !loading && (
            <button
              onClick={() => submitVoiceQuery(transcript)}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              Submit Prompt <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* AI Spoken Answer Transcript */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              LearnPilot Spoken Explanation
            </span>
            {loading && <span className="text-xs text-indigo-600 font-semibold animate-pulse">Generating lesson...</span>}
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 min-h-24 max-h-56 overflow-y-auto leading-relaxed">
            {lastAnswer}
          </div>
        </div>
      </div>

      {/* Recommended Voice Prompts */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <span className="text-xs font-bold text-slate-700 block mb-2.5">
          Try Speaking One of These Prompts:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sampleVoicePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(p.query)
                submitVoiceQuery(p.query)
              }}
              className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-left text-xs font-medium text-slate-700 hover:text-indigo-900 transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

