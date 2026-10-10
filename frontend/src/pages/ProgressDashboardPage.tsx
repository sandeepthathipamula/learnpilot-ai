import React from 'react'
import {
  TrendingUp,
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react'
import type { LearningProgress } from '../types'

interface ProgressDashboardPageProps {
  progress: LearningProgress | null
  onPracticeTopic: (topic: string) => void
}

export const ProgressDashboardPage: React.FC<ProgressDashboardPageProps> = ({
  progress,
  onPracticeTopic
}) => {
  const avgScore = progress?.average_score ?? 72
  const masteryLabel = progress?.mastery_label ?? 'Proficient & Growing'
  const topics = progress?.topics ?? []
  const misconceptions = progress?.misconceptions_detected ?? []
  const recentAttempts = progress?.recent_attempts ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <TrendingUp size={13} /> Adaptive Learning Analytics
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Knowledge & Mastery Profile</h2>
          <p className="text-xs text-slate-500">Live evidence tracking calculated from diagnostic evaluations and conversational problem-solving</p>
        </div>
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Mastery</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{avgScore}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${avgScore}%` }} />
          </div>
          <span className="text-xs text-indigo-700 font-semibold mt-2 block">{masteryLabel}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluations Completed</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award size={16} />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{progress?.assessments_completed ?? 3}</div>
          <p className="text-xs text-slate-500 mt-2">Every submission recalibrates topic mastery weighting.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Misconceptions</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{misconceptions.length}</div>
          <p className="text-xs text-slate-500 mt-2">Prioritized for upcoming practice challenges.</p>
        </div>
      </div>

      {/* Topics Detailed Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Topic Mastery Breakdown</h3>
        <div className="space-y-4">
          {topics.map(t => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t.topic}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.mastery_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    t.mastery_score >= 60 ? 'bg-indigo-100 text-indigo-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {t.mastery_score >= 80 ? 'Mastered' : t.mastery_score >= 60 ? 'In Progress' : 'Needs Practice'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-md">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.mastery_score >= 80 ? 'bg-emerald-500' : t.mastery_score >= 60 ? 'bg-indigo-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${t.mastery_score}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3">
                  <span>{t.attempts_count} Attempts</span>
                  <span>•</span>
                  <span>Last tested: {new Date(t.last_studied).toLocaleDateString()}</span>
                </div>
                {t.misconceptions && t.misconceptions.length > 0 && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 max-w-lg">
                    <strong>Flagged Gap:</strong> {t.misconceptions[0]}
                  </div>
                )}
              </div>

              <button
                onClick={() => onPracticeTopic(t.topic)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold self-start md:self-center shrink-0 flex items-center gap-1 transition-colors"
              >
                Practice Topic <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Attempts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Diagnostic Attempts</h3>
        {recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-400">No attempts logged yet. Complete a quiz to see real progress records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Topic</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Feedback & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAttempts.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{att.topic}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{att.score}%</td>
                    <td className="p-3 text-slate-400">{new Date(att.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{att.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

