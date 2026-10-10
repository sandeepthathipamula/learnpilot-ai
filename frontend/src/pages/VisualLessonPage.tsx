import React, { useState } from 'react'
import {
  Layers,
  Database,
  Terminal,
  Cpu,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { VisualTeachingCanvas } from '../components/VisualTeachingCanvas'
import { generateVisualSpec } from '../services/api'
import type { VisualSpec } from '../types'

export const VisualLessonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'loop' | 'ml' | 'custom'>('sql')
  const [customConcept, setCustomConcept] = useState('')
  const [customSpec, setCustomSpec] = useState<VisualSpec | null>(null)
  const [loading, setLoading] = useState(false)

  const sqlSpec: VisualSpec = {
    type: 'sql_join',
    title: 'Relational Database Join Operations',
    description: 'Observe key pairing between primary key id and foreign key dept_id.',
    default_join: 'INNER JOIN',
    table_a: {
      name: 'Students',
      columns: ['id', 'name', 'dept_id'],
      rows: [
        [101, 'Aarav', 10],
        [102, 'Diya', 20],
        [103, 'Kavya', 30],
        [104, 'Rohan', 10]
      ]
    },
    table_b: {
      name: 'Departments',
      columns: ['dept_id', 'dept_name'],
      rows: [
        [10, 'Computer Science'],
        [20, 'Data Engineering'],
        [40, 'Information Security']
      ]
    }
  }

  const loopSpec: VisualSpec = {
    type: 'python_loop',
    title: 'Python Accumulator Loop & Execution State',
    description: 'Trace variable values step by step across each iteration of the loop.',
    code: 'total = 0\nfor i in range(1, 5):\n    total += i\n    print(f"i: {i}, total: {total}")',
    steps: [
      { line: 1, i: '-', total: 0, output: 'total = 0', explanation: 'Register initialization: accumulator variable total set to 0.' },
      { line: 2, i: 1, total: 0, output: '-', explanation: 'Iteration 1: i takes value 1 from range(1, 5).' },
      { line: 3, i: 1, total: 1, output: 'i: 1, total: 1', explanation: 'Accumulate: total becomes 0 + 1 = 1.' },
      { line: 2, i: 2, total: 1, output: '-', explanation: 'Iteration 2: i advances to 2.' },
      { line: 3, i: 2, total: 3, output: 'i: 2, total: 3', explanation: 'Accumulate: total becomes 1 + 2 = 3.' },
      { line: 2, i: 3, total: 3, output: '-', explanation: 'Iteration 3: i advances to 3.' },
      { line: 3, i: 3, total: 6, output: 'i: 3, total: 6', explanation: 'Accumulate: total becomes 3 + 3 = 6.' },
      { line: 2, i: 4, total: 6, output: '-', explanation: 'Iteration 4: i takes last element 4 from range(1, 5).' },
      { line: 3, i: 4, total: 10, output: 'i: 4, total: 10', explanation: 'Accumulate: total becomes 6 + 4 = 10.' },
      { line: 4, i: 4, total: 10, output: 'Loop done', explanation: 'Range exhausted. Loop terminates with final total = 10.' }
    ]
  }

  const mlSpec: VisualSpec = {
    type: 'ml_pipeline',
    title: 'Machine Learning Data & Training Pipeline',
    description: 'Interactive flow of data transformation from raw sensors to model inferences.',
    stages: [
      { id: 'raw', label: 'Raw Data Ingestion', detail: 'Collect raw features and ground truth labels from database', status: 'done' },
      { id: 'clean', label: 'Preprocessing & Cleaning', detail: 'Impute missing values, remove outliers, and standardize vectors', status: 'active' },
      { id: 'features', label: 'Feature Engineering', detail: 'Extract one-hot categorical tokens and polynomial features', status: 'pending' },
      { id: 'split', label: 'Train / Test Split', detail: 'Strict 80/20 train/test partition to prevent data leakage', status: 'pending' },
      { id: 'train', label: 'Model Optimization', detail: 'Iterate epochs with Adam optimizer to minimize binary cross-entropy loss', status: 'pending' },
      { id: 'eval', label: 'Evaluation Metrics', detail: 'Measure Accuracy, Precision, Recall, and ROC-AUC curve', status: 'pending' }
    ]
  }

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customConcept.trim()) return
    setLoading(true)
    try {
      const spec = await generateVisualSpec(customConcept)
      setCustomSpec(spec)
    } catch {
      setCustomSpec(sqlSpec)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <Layers size={13} /> Visual Teaching Canvas
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Interactive Pedagogical Demonstrations</h2>
          <p className="text-xs text-slate-500">Live SVG and Canvas models for databases, execution tracing, and machine learning</p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'sql' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database size={14} /> SQL Joins
          </button>
          <button
            onClick={() => setActiveTab('loop')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'loop' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal size={14} /> Python Loops
          </button>
          <button
            onClick={() => setActiveTab('ml')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'ml' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={14} /> ML Pipelines
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} /> Generate Custom
          </button>
        </div>
      </div>

      {/* Content Rendering based on Tab */}
      {activeTab === 'sql' && <VisualTeachingCanvas spec={sqlSpec} />}
      {activeTab === 'loop' && <VisualTeachingCanvas spec={loopSpec} />}
      {activeTab === 'ml' && <VisualTeachingCanvas spec={mlSpec} />}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <form onSubmit={handleGenerateCustom} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex gap-2">
            <input
              type="text"
              value={customConcept}
              onChange={e => setCustomConcept(e.target.value)}
              placeholder="e.g. SQL Outer Join, Recursion Stack, Binary Search Tree..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !customConcept.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Visual
            </button>
          </form>

          {customSpec ? (
            <VisualTeachingCanvas spec={customSpec} />
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Type any concept above to dynamically generate an interactive visual teaching model.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

