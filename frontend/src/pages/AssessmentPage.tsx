import React, { useState } from 'react'
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Award
} from 'lucide-react'
import type { Assessment, AssessmentResult } from '../types'
import { createAssessment, submitAssessment } from '../services/api'

interface AssessmentPageProps {
  onStartTeachingTopic: (topic: string) => void
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ onStartTeachingTopic }) => {
  const [topicInput, setTopicInput] = useState('Database Normalization (1NF to BCNF)')
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (topicToUse?: string) => {
    const t = topicToUse || topicInput.trim()
    if (!t) return
    setLoading(true)
    setError('')
    setResult(null)
    setUserAnswers({})
    try {
      const data = await createAssessment(t)
      setAssessment(data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate diagnostic assessment.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (qIdx: number, optionVal: string) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: optionVal }))
  }

  const handleSubmit = async () => {
    if (!assessment) return
    const answersList = assessment.questions.map((_, idx) => userAnswers[idx] || '')
    setSubmitting(true)
    setError('')
    try {
      const res = await submitAssessment(assessment.id, answersList)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment answers.')
    } finally {
      setSubmitting(false)
    }
  }

  const quickTopics = [
    'Database Normalization (1NF to BCNF)',
    'Python Loop Variable Bounds',
    'SQL Joins & NULL Value Handling',
    'Machine Learning Overfitting & Regularization'
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <BookOpen size={13} /> Assessment Agent
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Diagnostic Knowledge Assessment</h2>
          <p className="text-xs text-slate-500">Targeted evaluations designed to detect specific conceptual knowledge gaps</p>
        </div>
      </div>

      {/* Topic Chooser Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Assessment Topic or Syllabus Skill
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            placeholder="e.g. Relational Calculus, Dijkstra's Algorithm, SQL Subqueries..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !topicInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generate Quiz
          </button>
        </div>

        {/* Quick Topics */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Quick Topics:</span>
          {quickTopics.map((qt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopicInput(qt)
                handleGenerate(qt)
              }}
              className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors"
            >
              {qt}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0" /> {error}
        </div>
      )}

      {/* Active Diagnostic Quiz Questions */}
      {assessment && !result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800">Topic: {assessment.topic}</h3>
            <span className="text-xs text-slate-500 font-mono">{assessment.questions.length} Diagnostic Items</span>
          </div>

          {assessment.questions.map((q, idx) => (
            <div key={q.id || idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  {q.prompt}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1 pl-7">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[idx] === String(optIdx) || userAnswers[idx] === opt
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(idx, String(optIdx))}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 size={15} className="text-indigo-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(userAnswers).length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              {submitting ? 'Evaluating with Assessment Agent...' : 'Submit Answers for Diagnostic Evaluation'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${result.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Diagnostic Assessment Complete</h3>
                <p className="text-xs text-slate-500">Evaluated against foundational curriculum rubrics</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-indigo-600">{result.score}%</span>
              <span className="text-xs text-slate-400 block">{result.correct_count} of {result.total_questions} correct</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Assessment Feedback
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{result.feedback}</p>
          </div>

          {/* Misconceptions */}
          {result.misconceptions && result.misconceptions.length > 0 && (
            <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-200">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-rose-600" /> Detected Knowledge Gaps & Misconceptions:
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-800">
                {result.misconceptions.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Action & Jump to Teaching */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Next Adaptive Step</span>
              <span className="text-xs font-semibold text-indigo-700">{result.next_action}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate()}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <RotateCcw size={13} /> Retake Quiz
              </button>
              <button
                onClick={() => onStartTeachingTopic(assessment?.topic || topicInput)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                Practice in Workspace <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

