import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import type { StudyPlan, StudySession } from '../types'
import { createStudyPlan, fetchStudyPlans, patchStudyPlan } from '../services/api'

interface StudyPlannerPageProps {
  onStudySession: (subject: string, topic: string) => void
}

export const StudyPlannerPage: React.FC<StudyPlannerPageProps> = ({ onStudySession }) => {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [examDate, setExamDate] = useState('2026-11-20')
  const [dailyMinutes, setDailyMinutes] = useState(60)
  const [subjectsText, setSubjectsText] = useState('Database Management Systems, Python Programming, Operating Systems')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)

  const loadPlans = async () => {
    setLoading(true)
    try {
      const data = await fetchStudyPlans()
      setPlans(data)
      if (data.length > 0) {
        setActivePlan(data[0])
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch study plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const subjects = subjectsText.split(',').map(s => s.trim()).filter(Boolean)
    if (subjects.length === 0) return

    setCreating(true)
    setError('')
    try {
      const newPlan = await createStudyPlan(examDate, dailyMinutes, subjects)
      setPlans(prev => [newPlan, ...prev])
      setActivePlan(newPlan)
    } catch (err: any) {
      setError(err.message || 'Failed to create study plan')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleSession = async (sessionIdx: number) => {
    if (!activePlan) return
    const updatedSessions = [...activePlan.sessions]
    updatedSessions[sessionIdx].completed = !updatedSessions[sessionIdx].completed

    // Optimistic update
    setActivePlan({ ...activePlan, sessions: updatedSessions })

    try {
      await patchStudyPlan(activePlan.id, [sessionIdx])
    } catch (err: any) {
      setError(err.message || 'Failed to update session progress')
    }
  }

  const calculateDaysRemaining = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <Calendar size={13} /> Autonomous Study Planner
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Exam Prep Timeline & Task Scheduler</h2>
          <p className="text-xs text-slate-500">Generates structured daily milestones and recalculates remaining sessions when plans adjust</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0" /> {error}
        </div>
      )}

      {/* Plan Generator Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Configure Target Exam & Syllabus</h3>
        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Exam Date</label>
            <input
              type="date"
              required
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Daily Study Target</label>
            <select
              value={dailyMinutes}
              onChange={e => setDailyMinutes(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value={30}>30 Minutes / day</option>
              <option value={45}>45 Minutes / day</option>
              <option value={60}>60 Minutes / day</option>
              <option value={90}>90 Minutes / day</option>
              <option value={120}>120 Minutes / day</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subjects (Comma Separated)</label>
            <input
              type="text"
              required
              value={subjectsText}
              onChange={e => setSubjectsText(e.target.value)}
              placeholder="DBMS, Python, OS..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              {creating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Structured Study Plan
            </button>
          </div>
        </form>
      </div>

      {/* Active Plan Detail & Checklist */}
      {activePlan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Active Exam Schedule</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Target Exam: {new Date(activePlan.exam_date).toLocaleDateString()}
              </h3>
              <p className="text-xs text-slate-500">
                {calculateDaysRemaining(activePlan.exam_date)} days remaining · {activePlan.daily_minutes} mins daily commitment
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {activePlan.subjects.map((sub, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-medium text-slate-700">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Session Milestones Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Day-by-Day Learning Sessions</span>
              <span>
                {activePlan.sessions.filter(s => s.completed).length} of {activePlan.sessions.length} Completed
              </span>
            </div>

            {activePlan.sessions.map((session, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  session.completed
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleSession(idx)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      session.completed
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 hover:border-indigo-500 text-transparent'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Day {session.day}: {session.topic || session.subject}
                      </span>
                      {session.priority && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          session.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {session.priority} Priority
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {session.duration_minutes} mins
                      </span>
                      <span>•</span>
                      <span>{session.subject}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onStudySession(session.subject, session.topic || session.subject)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  Start Session <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

