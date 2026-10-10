import React from 'react'
import { FileText, X, BookOpen } from 'lucide-react'
import type { Citation } from '../types'

interface CitationViewerProps {
  citation: Citation | null
  onClose: () => void
}

export const CitationViewer: React.FC<CitationViewerProps> = ({ citation, onClose }) => {
  if (!citation) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <FileText size={16} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{citation.document_name}</h4>
              <p className="text-[11px] text-slate-500">Academic Citation · Page {citation.page}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 block mb-1.5 flex items-center gap-1">
            <BookOpen size={13} /> Grounded Document Excerpt
          </span>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 font-mono leading-relaxed max-h-60 overflow-y-auto">
            "{citation.excerpt}"
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            This response is directly grounded in your verified academic notes uploaded to LearnPilot AI.
          </p>
        </div>
      </div>
    </div>
  )
}

