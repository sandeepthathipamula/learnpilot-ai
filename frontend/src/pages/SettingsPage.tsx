import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Volume2,
  Globe,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ShieldCheck
} from 'lucide-react'
import type { UserProfile, TeachingMode } from '../types'
import { checkHealth } from '../services/api'

interface SettingsPageProps {
  user: UserProfile
  onUpdateUser: (updated: Partial<UserProfile>) => void
  onClearSession: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateUser,
  onClearSession
}) => {
  const [healthStatus, setHealthStatus] = useState<{
    status: string
    gemini_configured: boolean
    model: string | null
  } | null>(null)
  const [checking, setChecking] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Local form state
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [defaultMode, setDefaultMode] = useState<TeachingMode>(user.preferences.default_mode)
  const [language, setLanguage] = useState(user.preferences.preferred_language)
  const [voiceSpeed, setVoiceSpeed] = useState(user.preferences.voice_speed)

  const checkApiHealth = async () => {
    setChecking(true)
    try {
      const res = await checkHealth()
      setHealthStatus(res)
    } catch {
      setHealthStatus({ status: 'offline', gemini_configured: false, model: null })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkApiHealth()
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateUser({
      name,
      email,
      preferences: {
        default_mode: defaultMode,
        preferred_language: language,
        voice_speed: voiceSpeed
      }
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <SettingsIcon size={13} /> Preferences & Configuration
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Settings & Profile</h2>
          <p className="text-xs text-slate-500">Configure default voice dynamics, pedagogical modes, and monitor backend Gemini connectivity</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Preferences successfully saved!
        </div>
      )}

      {/* Backend & Gemini Monitor Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Cpu size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Google Gemini API Provider Status</h3>
          </div>
          <button
            onClick={checkApiHealth}
            disabled={checking}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
            title="Check connection health"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Connection</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {healthStatus?.status === 'ok' ? 'Operational' : 'Checking...'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Active Model</span>
            <div className="text-xs font-mono font-bold text-indigo-700">
              {healthStatus?.model || 'gemini-3.8-flash'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Credentials</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <ShieldCheck size={14} className="text-indigo-600" />
              {healthStatus?.gemini_configured ? 'Verified Server-Side' : 'Pending Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile & Preferences Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Student Profile & Voice Dynamics</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Default Teaching Mode</label>
            <select
              value={defaultMode}
              onChange={e => setDefaultMode(e.target.value as TeachingMode)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="friend">Friend Mode (Encouraging analogies & peer tone)</option>
              <option value="teacher">Teacher Mode (Structured logic & check questions)</option>
              <option value="doing">Learn by Doing (Immediate coding micro-challenges)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="English">English</option>
              <option value="Telugu">Telugu (Bilingual technical explanations)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Voice Synthesis Rate ({voiceSpeed}x)</label>
              <span className="text-xs text-slate-400 font-mono">{voiceSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={voiceSpeed}
              onChange={e => setVoiceSpeed(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClearSession}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
          >
            <Trash2 size={14} /> Clear Local Cache
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}

