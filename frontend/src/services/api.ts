import type {
  Citation,
  WorkflowEvent,
  Message,
  Conversation,
  DocumentItem,
  Assessment,
  AssessmentResult,
  StudyPlan,
  LearningProgress,
  VisualSpec,
  TeachingMode,
  UserProfile
} from '../types'

export type ChatReply = {
  conversation_id: string
  message: Message
  events: WorkflowEvent[]
}

const API_BASE = '/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}))
    throw new Error(errorJson.detail || `Request failed with status ${response.status}`)
  }
  return response.json()
}

export async function checkHealth(): Promise<{ status: string; gemini_configured: boolean; model: string | null }> {
  return request('/health')
}

export async function sendChat(
  message: string,
  conversationId?: string,
  mode: TeachingMode = 'teacher',
  userId: string = 'guest'
): Promise<ChatReply> {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId, mode, user_id: userId })
  })
}

export async function fetchConversations(): Promise<Conversation[]> {
  return request('/conversations')
}

export async function fetchConversation(id: string): Promise<{ id: string; messages: Message[] }> {
  return request(`/conversations/${id}`)
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}))
    throw new Error(errorJson.detail || 'Failed to upload document')
  }
  return response.json()
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  return request('/documents')
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete document')
  }
}

export async function createAssessment(topic: string): Promise<Assessment> {
  return request('/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic })
  })
}

export async function submitAssessment(assessmentId: string, answers: string[]): Promise<AssessmentResult> {
  return request(`/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  })
}

export async function fetchProgress(): Promise<LearningProgress> {
  return request('/progress')
}

export async function createStudyPlan(
  exam_date: string,
  daily_minutes: number,
  subjects: string[],
  priorities?: string
): Promise<StudyPlan> {
  return request('/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exam_date, daily_minutes, subjects, priorities })
  })
}

export async function fetchStudyPlans(): Promise<StudyPlan[]> {
  return request('/study-plans')
}

export async function patchStudyPlan(planId: string, completed_sessions: number[]): Promise<{ id: string; sessions: any[]; message: string }> {
  return request(`/study-plans/${planId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed_sessions })
  })
}

export async function generateVisualSpec(concept: string): Promise<VisualSpec> {
  return request(`/visual/generate?concept=${encodeURIComponent(concept)}`, {
    method: 'POST'
  })
}

export async function loginUser(email: string): Promise<UserProfile> {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo' })
  })
}
