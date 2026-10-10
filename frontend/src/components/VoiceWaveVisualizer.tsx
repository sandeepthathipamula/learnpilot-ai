import React from 'react'
import { motion } from 'framer-motion'
import { Volume2, Mic } from 'lucide-react'

interface VoiceVisualizerProps {
  isListening: boolean
  isSpeaking: boolean
  volumeLevel?: number
}

export const VoiceWaveVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  volumeLevel = 1.0
}) => {
  const bars = [4, 8, 14, 22, 32, 24, 16, 28, 36, 20, 12, 6]

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 my-4">
      <div className="flex items-center gap-2 mb-4">
        {isListening ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-semibold animate-pulse">
            <Mic size={14} className="text-rose-400" /> Listening to your speech...
          </span>
        ) : isSpeaking ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-semibold">
            <Volume2 size={14} className="text-indigo-400" /> LearnPilot speaking...
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium">
            Voice ready · Click microphone to speak
          </span>
        )}
      </div>

      {/* Dynamic Animated Sound Bars */}
      <div className="flex items-center justify-center gap-1.5 h-20 w-full max-w-xs">
        {bars.map((h, i) => {
          const isActive = isListening || isSpeaking
          return (
            <motion.div
              key={i}
              className={`w-1.5 rounded-full transition-all ${
                isListening
                  ? 'bg-gradient-to-t from-rose-500 to-rose-300'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-indigo-500 to-cyan-300'
                  : 'bg-slate-700'
              }`}
              animate={
                isActive
                  ? {
                      height: [
                        Math.max(6, (h * 0.4) * volumeLevel),
                        Math.max(8, (h * 1.5) * volumeLevel),
                        Math.max(6, (h * 0.5) * volumeLevel)
                      ]
                    }
                  : { height: 6 }
              }
              transition={
                isActive
                  ? {
                      duration: 0.6 + (i % 4) * 0.15,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.05
                    }
                  : { duration: 0.2 }
              }
            />
          )
        })}
      </div>
    </div>
  )
}

