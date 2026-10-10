import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Database,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react'
import type { VisualSpec } from '../types'

interface VisualCanvasProps {
  spec: VisualSpec
  onSpeakStep?: (text: string) => void
}

export const VisualTeachingCanvas: React.FC<VisualCanvasProps> = ({ spec, onSpeakStep }) => {
  // --- SQL Join State ---
  const [activeJoin, setActiveJoin] = useState<string>(spec.default_join || 'INNER JOIN')

  // --- Python Loop Tracer State ---
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // --- ML Pipeline Stage State ---
  const [activeStageId, setActiveStageId] = useState<string>(
    spec.stages && spec.stages.length > 0 ? spec.stages[0].id : 'raw'
  )

  // Handlers for Loop Tracer
  const handleNextStep = () => {
    if (!spec.steps) return
    if (currentStepIdx < spec.steps.length - 1) {
      const nextIdx = currentStepIdx + 1
      setCurrentStepIdx(nextIdx)
      if (onSpeakStep && spec.steps[nextIdx].explanation) {
        onSpeakStep(spec.steps[nextIdx].explanation)
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1)
    }
  }

  const handleResetStep = () => {
    setCurrentStepIdx(0)
    setIsPlaying(false)
  }

  // --- RENDER 1: SQL JOIN EXPLORER ---
  if (spec.type === 'sql_join') {
    const tableA = spec.table_a || {
      name: 'Students',
      columns: ['id', 'name', 'dept_id'],
      rows: [
        [1, 'Aarav', 10],
        [2, 'Diya', 20],
        [3, 'Rahul', 30],
        [4, 'Priya', 10]
      ]
    }

    const tableB = spec.table_b || {
      name: 'Departments',
      columns: ['dept_id', 'dept_name'],
      rows: [
        [10, 'Computer Science'],
        [20, 'Data Science'],
        [40, 'Mathematics']
      ]
    }

    // Compute joined rows based on active join
    let joinedRows: any[] = []
    if (activeJoin === 'INNER JOIN') {
      tableA.rows.forEach(a => {
        const match = tableB.rows.find(b => b[0] === a[2])
        if (match) {
          joinedRows.push([a[0], a[1], a[2], match[1]])
        }
      })
    } else if (activeJoin === 'LEFT JOIN') {
      tableA.rows.forEach(a => {
        const match = tableB.rows.find(b => b[0] === a[2])
        joinedRows.push([a[0], a[1], a[2], match ? match[1] : 'NULL'])
      })
    } else if (activeJoin === 'RIGHT JOIN') {
      tableB.rows.forEach(b => {
        const matches = tableA.rows.filter(a => a[2] === b[0])
        if (matches.length > 0) {
          matches.forEach(m => joinedRows.push([m[0], m[1], b[0], b[1]]))
        } else {
          joinedRows.push(['NULL', 'NULL', b[0], b[1]])
        }
      })
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm my-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{spec.title || 'SQL Relational Join Explorer'}</h3>
              <p className="text-xs text-slate-500">Live relational matching between foreign keys and primary keys</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN'] as const).map(jType => (
              <button
                key={jType}
                onClick={() => setActiveJoin(jType)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeJoin === jType
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {jType}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Table A */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon size={14} className="text-indigo-500" />
                Table A: {tableA.name}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">ON {tableA.name}.dept_id</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-medium">
                  <tr>
                    {tableA.columns.map(c => (
                      <th key={c} className="p-2 border-b border-slate-200">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {tableA.rows.map((r, idx) => {
                    const hasMatch = tableB.rows.some(b => b[0] === r[2])
                    const isHighlighted = (activeJoin === 'INNER JOIN' && hasMatch) || activeJoin === 'LEFT JOIN'
                    return (
                      <tr key={idx} className={isHighlighted ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-500'}>
                        {r.map((val, cIdx) => (
                          <td key={cIdx} className="p-2">{val}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon size={14} className="text-indigo-500" />
                Table B: {tableB.name}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">ON {tableB.name}.dept_id</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-medium">
                  <tr>
                    {tableB.columns.map(c => (
                      <th key={c} className="p-2 border-b border-slate-200">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {tableB.rows.map((r, idx) => {
                    const hasMatch = tableA.rows.some(a => a[2] === r[0])
                    const isHighlighted = (activeJoin === 'INNER JOIN' && hasMatch) || (activeJoin === 'RIGHT JOIN')
                    return (
                      <tr key={idx} className={isHighlighted ? 'bg-indigo-50/70 text-indigo-900 font-semibold' : 'text-slate-500'}>
                        {r.map((val, cIdx) => (
                          <td key={cIdx} className="p-2">{val}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Result Table */}
        <div className="border border-indigo-200 rounded-lg p-3.5 bg-indigo-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Resulting Set ({activeJoin})
            </span>
            <span className="text-xs text-indigo-700 font-semibold">{joinedRows.length} matching rows found</span>
          </div>
          <div className="overflow-x-auto bg-white rounded-md border border-indigo-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2">id</th>
                  <th className="p-2">name</th>
                  <th className="p-2">dept_id</th>
                  <th className="p-2">dept_name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {joinedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                    {r.map((val: any, cIdx: number) => (
                      <td key={cIdx} className={`p-2 ${val === 'NULL' ? 'text-rose-500 font-bold' : 'text-slate-800'}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER 2: PYTHON LOOP TRACER ---
  if (spec.type === 'python_loop') {
    const steps = spec.steps || [
      { line: 1, i: '-', total: 0, output: 'Init: total = 0', explanation: 'Accumulator variable total initialized.' },
      { line: 2, i: 1, total: 0, output: '-', explanation: 'Loop iteration 1 starts: i = 1.' },
      { line: 3, i: 1, total: 1, output: 'i: 1, total: 1', explanation: 'total = 0 + 1 = 1.' },
      { line: 2, i: 2, total: 1, output: '-', explanation: 'Loop advances: i = 2.' },
      { line: 3, i: 2, total: 3, output: 'i: 2, total: 3', explanation: 'total = 1 + 2 = 3.' },
      { line: 4, i: 2, total: 3, output: 'Done', explanation: 'Loop execution terminates.' }
    ]

    const activeStep = steps[currentStepIdx] || steps[0]
    const codeLines = (spec.code || 'total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)').split('\n')

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm my-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Terminal size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{spec.title || 'Interactive Code & Loop Tracer'}</h3>
              <p className="text-xs text-slate-500">Step through execution line by line to observe register & variable state</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <span className="text-xs font-mono font-medium text-slate-600 px-1">
              Step {currentStepIdx + 1}/{steps.length}
            </span>
            <button
              onClick={handleNextStep}
              disabled={currentStepIdx === steps.length - 1}
              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Next <ChevronRight size={14} />
            </button>
            <button
              onClick={handleResetStep}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              title="Reset tracer"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Code with Line Highlight */}
          <div className="bg-slate-950 text-slate-200 rounded-lg p-3.5 font-mono text-xs overflow-x-auto shadow-inner">
            <div className="text-[11px] text-slate-500 uppercase tracking-widest mb-2 font-semibold border-b border-slate-800 pb-1">
              Script Execution
            </div>
            {codeLines.map((lineText, idx) => {
              const lineNum = idx + 1
              const isCurrent = activeStep.line === lineNum
              return (
                <div
                  key={idx}
                  className={`flex items-center px-2 py-0.5 rounded transition-colors ${
                    isCurrent ? 'bg-indigo-900/80 text-white font-bold border-l-2 border-indigo-400' : 'text-slate-400'
                  }`}
                >
                  <span className="w-6 text-slate-600 select-none text-[10px]">{lineNum}</span>
                  <span className="flex-1 whitespace-pre">{lineText}</span>
                  {isCurrent && <span className="text-[10px] text-indigo-300 ml-2">← PC</span>}
                </div>
              )
            })}
          </div>

          {/* Live Variable Watch Table */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-slate-600 uppercase tracking-wider font-bold mb-2">
                Variable Memory Table
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white border border-slate-200 p-2.5 rounded-md">
                  <span className="text-[11px] text-slate-400 block font-mono">Loop Index (i)</span>
                  <span className="text-lg font-bold font-mono text-indigo-600">{activeStep.i ?? '-'}</span>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-md">
                  <span className="text-[11px] text-slate-400 block font-mono">Accumulator (total)</span>
                  <span className="text-lg font-bold font-mono text-emerald-600">{activeStep.total ?? 0}</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-2 rounded-md">
                <span className="text-[11px] text-slate-400 block font-mono mb-0.5">Stdout Console</span>
                <span className="text-xs font-mono text-slate-800 block bg-slate-50 p-1.5 rounded border border-slate-100">
                  {activeStep.output || '> (no console output)'}
                </span>
              </div>
            </div>
            <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md">
              <span className="text-[11px] font-bold text-indigo-900 block mb-0.5">Pedagogical Insight</span>
              <p className="text-xs text-indigo-800">{activeStep.explanation}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER 3: MACHINE LEARNING PIPELINE ---
  if (spec.type === 'ml_pipeline') {
    const stages = spec.stages || [
      { id: 'raw', label: 'Raw Ingestion', detail: 'Collect tabular datasets and target ground truth', status: 'done' },
      { id: 'clean', label: 'Cleaning & Normalization', detail: 'Impute missing values, remove noise, and scale features', status: 'active' },
      { id: 'features', label: 'Feature Engineering', detail: 'Transform raw inputs into predictive mathematical representations', status: 'pending' },
      { id: 'split', label: 'Train/Test Split', detail: 'Partition dataset into 80% train and 20% holdout validation', status: 'pending' },
      { id: 'train', label: 'Model Optimization', detail: 'Run gradient descent backprop to optimize loss weights', status: 'pending' },
      { id: 'eval', label: 'Validation Metrics', detail: 'Compute Precision, Recall, and AUC-ROC curve', status: 'pending' }
    ]

    const selectedStage = stages.find(s => s.id === activeStageId) || stages[0]

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm my-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Cpu size={18} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{spec.title || 'Machine Learning Architecture Pipeline'}</h3>
            <p className="text-xs text-slate-500">Interactive dataflow stages from raw inputs to evaluated models</p>
          </div>
        </div>

        {/* Pipeline Workflow Track */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {stages.map((stage, idx) => {
            const isSelected = stage.id === activeStageId
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">0{idx + 1}</span>
                  {idx === 0 ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Layers size={13} className="text-indigo-400" />
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 leading-snug">{stage.label}</div>
              </button>
            )
          })}
        </div>

        {/* Stage Inspection Card */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Current Phase: {selectedStage.label}</h4>
          </div>
          <p className="text-xs text-slate-600 mb-3">{selectedStage.detail}</p>
          <div className="bg-white p-3 rounded-md border border-slate-200 text-xs font-mono text-slate-700">
            <strong>Theoretical Principle:</strong> Ensures unbiased data distribution and guards against training data leakage into validation holdouts.
          </div>
        </div>
      </div>
    )
  }

  return null
}

