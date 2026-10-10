import React, { useState } from 'react'
import { Sparkles, X, User, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import type { UserProfile } from '../types'
import { loginUser } from '../services/api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: UserProfile) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await loginUser(email || 'student@learnpilot.ai')
      onSuccess(user)
      onClose()
    } catch {
      // Fallback local profile
      onSuccess({
        id: 'user-' + Date.now(),
        name: name || (email ? email.split('@')[0] : 'Student'),
        email: email || 'student@learnpilot.ai',
        preferences: {
          default_mode: 'teacher',
          preferred_language: 'English',
          voice_speed: 1.0
        }
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    onSuccess({
      id: 'guest',
      name: 'Guest Scholar',
      email: 'guest@learnpilot.ai',
      preferences: {
        default_mode: 'teacher',
        preferred_language: 'English',
        voice_speed: 1.0
      }
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">LearnPilot AI</h3>
              <p className="text-xs text-slate-500">Don't Just Learn. Get Guided.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Academic Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In to Workspace' : 'Get Started Free'}
            <ArrowRight size={14} />
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider">or</span>
          </div>

          <button
            type="button"
            onClick={handleGuest}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <ShieldCheck size={14} className="text-emerald-600" /> Continue as Guest Scholar
          </button>
        </form>
      </div>
    </div>
  )
}

