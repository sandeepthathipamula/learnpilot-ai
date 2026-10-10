import React from 'react'
import {
  Sparkles,
  BookOpen,
  Mic,
  Calendar,
  FileText,
  Award,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronRight
} from 'lucide-react'
import type { LearningProgress, Conversation, UserProfile } from '../types'

interface DashboardPageProps {
  progress: LearningProgress | null
  conversations: Conversation[]
  user: UserProfile
  onNavigate: (view: string) => void
  onSelectConversation: (id: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  progress,
  conversations,
  user,
  onNavigate,
  onSelectConversation
}) => {
  const avgScore = progress?.average_score ?? 72
  const masteryLabel = progress?.mastery_label ?? 'Proficient & Growing'
  const misconceptions = progress?.misconceptions_detected ?? []
  const topics = progress?.topics ?? []

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200 mb-2">
            <Sparkles size={13} /> Active Learning Engine
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back, {user.name}</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            LearnPilot AI is currently tracking your knowledge gaps across active database, Python, and ML concepts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('voice')}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <Mic size={15} /> Voice Companion
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className="px-4 py-2 bg-white text-indigo-900 hover:bg-slate-100 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
          >
            New Session <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Average Mastery</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgScore}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${avgScore}%` }} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">{masteryLabel}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Study Streak</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <Award size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{progress?.streak_days ?? 4} Days</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1.5 block flex items-center gap-1">
            <CheckCircle2 size={12} /> Target achieved yesterday
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Diagnostic Quizzes</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <BookOpen size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{progress?.assessments_completed ?? 3} Taken</div>
          <button
            onClick={() => onNavigate('assessment')}
            className="text-[11px] text-indigo-600 font-semibold mt-1.5 block hover:underline"
          >
            Launch new diagnostic →
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Identified Gaps</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600">{misconceptions.length} Flagged</div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">Targeted in follow-ups</span>
        </div>
      </div>

      {/* Main Grid: Topic Progress & Misconceptions Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Topic Mastery Breakdown</h3>
              <p className="text-xs text-slate-500">Evaluated on real diagnostics and conceptual questioning</p>
            </div>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Analytics →
            </button>
          </div>

          <div className="space-y-3.5">
            {topics.slice(0, 5).map(topic => (
              <div key={topic.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{topic.topic}</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{topic.mastery_score}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      topic.mastery_score >= 80 ? 'bg-emerald-500' : topic.mastery_score >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${topic.mastery_score}%` }}
                  />
                </div>
                {topic.misconceptions && topic.misconceptions.length > 0 && (
                  <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                    <strong>Focus:</strong> {topic.misconceptions[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel: Quick Launchers & Recent Sessions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onNavigate('visual')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-semibold text-slate-700 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" />
                  Interactive Teaching Canvas
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('notes')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-semibold text-slate-700 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  My Academic Notes (RAG)
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('planner')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-semibold text-slate-700 transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  Autonomous Study Planner
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Learning Sessions</h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400">No previous sessions found. Start a new one!</p>
            ) : (
              <div className="space-y-2">
                {conversations.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id)
                      onNavigate('chat')
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs font-medium text-slate-700 truncate block transition-all"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

