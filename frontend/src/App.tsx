import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Home,
  BookOpen,
  Mic,
  Layers,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  Settings,
  PanelLeft,
  X,
  LogOut,
  User,
  CheckCircle2
} from 'lucide-react'
import type {
  Message,
  Conversation,
  TeachingMode,
  LearningProgress,
  UserProfile
} from './types'
import {
  sendChat,
  fetchConversations,
  fetchConversation,
  fetchProgress
} from './services/api'

// Import Pages & Modals
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChatWorkspacePage } from './pages/ChatWorkspacePage'
import { VoiceWorkspacePage } from './pages/VoiceWorkspacePage'
import { VisualLessonPage } from './pages/VisualLessonPage'
import { NotesLibraryPage } from './pages/NotesLibraryPage'
import { AssessmentPage } from './pages/AssessmentPage'
import { ProgressDashboardPage } from './pages/ProgressDashboardPage'
import { StudyPlannerPage } from './pages/StudyPlannerPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthModal } from './components/AuthModal'

const initialWelcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `### Welcome to LearnPilot AI! 🎓
**Don't Just Learn. Get Guided.**

I'm your autonomous learning companion. How would you like to begin today?
- **Explain a concept:** e.g. *"Explain SQL joins with interactive table animations"*
- **Code tracing:** e.g. *"Teach me Python loops with variable memory tracing"*
- **Bilingual assistance:** e.g. *"Explain Database Normalization in Telugu"*
- **Academic notes:** Upload your PDF notes in the *Notes Library* to receive grounded answers with citations.`,
  events: [{ label: 'Session initialized', state: 'complete' }]
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard')
  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage])
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [mode, setMode] = useState<TeachingMode>('teacher')
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('learnpilot_user')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    return {
      id: 'student-101',
      name: 'Alex Mercer',
      email: 'alex.mercer@university.edu',
      preferences: {
        default_mode: 'teacher',
        preferred_language: 'English',
        voice_speed: 1.0
      }
    }
  })

  // Load conversations and learning progress
  const refreshAppData = async () => {
    try {
      const [convs, prog] = await Promise.all([
        fetchConversations(),
        fetchProgress()
      ])
      setConversations(convs)
      setProgress(prog)
    } catch (err) {
      console.warn('Failed to refresh app data:', err)
    }
  }

  useEffect(() => {
    refreshAppData()
  }, [])

  useEffect(() => {
    localStorage.setItem('learnpilot_user', JSON.stringify(user))
  }, [user])

  // Start New Session
  const handleNewSession = () => {
    setConversationId(undefined)
    setMessages([initialWelcomeMessage])
    setChatError('')
    setCurrentView('chat')
    setSidebarOpen(false)
  }

  // Load previous conversation
  const handleSelectConversation = async (id: string) => {
    try {
      const data = await fetchConversation(id)
      setConversationId(id)
      setMessages(data.messages || [initialWelcomeMessage])
      setCurrentView('chat')
      setSidebarOpen(false)
    } catch {
      handleNewSession()
    }
  }

  // Handle sending chat message
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    setChatError('')
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setIsSending(true)

    try {
      const reply = await sendChat(trimmed, conversationId, mode, user.id)
      setConversationId(reply.conversation_id)
      setMessages(prev => [...prev, {
        ...reply.message,
        events: reply.events
      }])
      refreshAppData()
    } catch (err: any) {
      setChatError(err.message || 'Unable to connect with AI learning orchestrator.')
    } finally {
      setIsSending(false)
    }
  }

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content)
    }
  }

  // Handle voice query from Voice Studio
  const handleVoiceQuery = async (spokenText: string, chosenMode: TeachingMode): Promise<string> => {
    const reply = await sendChat(spokenText, conversationId, chosenMode, user.id)
    setConversationId(reply.conversation_id)
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: spokenText },
      { ...reply.message, events: reply.events }
    ])
    refreshAppData()
    return reply.message.content
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Learning Workspace', icon: BookOpen },
    { id: 'voice', label: 'Voice Studio', icon: Mic },
    { id: 'visual', label: 'Interactive Canvas', icon: Layers },
    { id: 'notes', label: 'My Notes (RAG)', icon: FileText },
    { id: 'assessment', label: 'Diagnostic Quiz', icon: Award },
    { id: 'progress', label: 'My Progress', icon: TrendingUp },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // If user explicitly views landing page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onStart={(initialPrompt) => {
          setCurrentView('chat')
          if (initialPrompt) {
            handleSendMessage(initialPrompt)
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2 text-left group"
            >
              <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Sparkles size={18} />
              </span>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900">LearnPilot</span>
                <span className="text-indigo-600 font-extrabold ml-1">AI</span>
                <span className="block text-[10px] text-slate-400 font-medium">Don't Just Learn. Get Guided.</span>
              </div>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Session Button */}
          <button
            onClick={handleNewSession}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus size={16} />
            <span>New Learning Session</span>
          </button>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isSelected = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
            <div className="leading-tight">
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[110px]">{user.name}</span>
              <span className="text-[10px] text-slate-400">Student Scholar</span>
            </div>
          </button>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            title="Switch User / Sign In"
          >
            <User size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100"
            >
              <PanelLeft size={18} />
            </button>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {navItems.find(i => i.id === currentView)?.label || 'Learning Studio'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Gemini 3.8 Flash Connected
            </span>
            <button
              onClick={() => setCurrentView('landing')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Product Overview
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardPage
              progress={progress}
              conversations={conversations}
              user={user}
              onNavigate={(v) => setCurrentView(v)}
              onSelectConversation={handleSelectConversation}
            />
          )}

          {currentView === 'chat' && (
            <ChatWorkspacePage
              messages={messages}
              isSending={isSending}
              error={chatError}
              mode={mode}
              onSetMode={(m) => setMode(m)}
              onSendMessage={handleSendMessage}
              onRetryLast={handleRetryLast}
            />
          )}

          {currentView === 'voice' && (
            <VoiceWorkspacePage
              onSendVoiceQuery={handleVoiceQuery}
            />
          )}

          {currentView === 'visual' && (
            <VisualLessonPage />
          )}

          {currentView === 'notes' && (
            <NotesLibraryPage
              onAskAboutDoc={(docName) => {
                setCurrentView('chat')
                handleSendMessage(`Explain the key concepts in uploaded document: ${docName}`)
              }}
            />
          )}

          {currentView === 'assessment' && (
            <AssessmentPage
              onStartTeachingTopic={(topic) => {
                setCurrentView('chat')
                handleSendMessage(`Teach me ${topic} step by step with examples and practice problems.`)
              }}
            />
          )}

          {currentView === 'progress' && (
            <ProgressDashboardPage
              progress={progress}
              onPracticeTopic={(topic) => {
                setCurrentView('chat')
                handleSendMessage(`Help me master ${topic}. Let's address my misconceptions.`)
              }}
            />
          )}

          {currentView === 'planner' && (
            <StudyPlannerPage
              onStudySession={(subject, topic) => {
                setCurrentView('chat')
                handleSendMessage(`Let's start today's study session on ${subject}: ${topic}`)
              }}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              user={user}
              onUpdateUser={(updated) => setUser(u => ({ ...u, ...updated }))}
              onClearSession={() => {
                localStorage.removeItem('learnpilot_user')
                handleNewSession()
              }}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />
    </div>
  )
}
