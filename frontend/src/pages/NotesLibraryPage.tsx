import React, { useState, useEffect } from 'react'
import {
  FileText,
  UploadCloud,
  Trash2,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react'
import type { DocumentItem } from '../types'
import { fetchDocuments, uploadDocument, deleteDocument } from '../services/api'

interface NotesLibraryPageProps {
  onAskAboutDoc: (docName: string) => void
}

export const NotesLibraryPage: React.FC<NotesLibraryPageProps> = ({ onAskAboutDoc }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  const loadDocs = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDocuments()
      setDocuments(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are supported for RAG indexing.')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds maximum 20MB limit.')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const newDoc = await uploadDocument(file)
      setSuccess(`"${newDoc.name}" uploaded and indexed successfully (${newDoc.page_count} pages).`)
      loadDocs()
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse PDF.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all associated vector chunks?`)) return
    try {
      await deleteDocument(id)
      setDocuments(docs => docs.filter(d => d.id !== id))
      setSuccess(`Deleted "${name}".`)
    } catch (err: any) {
      setError(err.message || 'Failed to delete document')
    }
  }

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-1">
            <BookOpen size={13} /> Academic Knowledge & RAG
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Academic Notes & Syllabus Library</h2>
          <p className="text-xs text-slate-500">Upload PDF course materials for grounded retrieval, verified citations, and page references</p>
        </div>
        <button
          onClick={loadDocs}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          title="Refresh documents"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> {success}
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 rounded-2xl p-8 text-center transition-all">
        <UploadCloud size={36} className="mx-auto text-indigo-500 mb-2" />
        <h3 className="text-sm font-bold text-slate-900">Upload Academic Notes or Syllabus PDF</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          PyMuPDF extracts page text, creates semantic chunks, and links citations to your questions. Up to 20MB.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all">
          <span>{uploading ? 'Extracting & Indexing...' : 'Choose PDF File'}</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Document Search & List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search uploaded notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'Document' : 'Documents'}
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {documents.length === 0 ? 'No documents uploaded yet. Upload your first PDF above!' : 'No matching documents found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span>{doc.page_count} Pages</span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>Added {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAskAboutDoc(doc.name)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Ask AI <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

