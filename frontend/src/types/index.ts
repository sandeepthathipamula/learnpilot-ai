export type TeachingMode = 'friend' | 'teacher' | 'doing'

export type Citation = {
  document_name: string
  page: number
  excerpt: string
}

export type WorkflowEvent = {
  label: string
  state: 'complete' | 'active'
}

export type VisualSpec = {
  type: 'sql_join' | 'python_loop' | 'ml_pipeline' | 'flowchart'
  title: string
  description?: string
  default_join?: string
  table_a?: {
    name: string
    columns: string[]
    rows: (string | number)[][]
  }
  table_b?: {
    name: string
    columns: string[]
    rows: (string | number)[][]
  }
  code?: string
  steps?: {
    line: number
    i?: any
    total?: any
    output: string
    explanation: string
  }[]
  stages?: {
    id: string
    label: string
    detail: string
    status: 'done' | 'active' | 'pending'
  }[]
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  visual_spec?: VisualSpec | null
  events?: WorkflowEvent[]
  created_at?: string
}

export type Conversation = {
  id: string
  title: string
  mode: string
  created_at: string
  updated_at: string
}

export type DocumentItem = {
  id: string
  name: string
  file_size: number
  page_count: number
  created_at: string
}

export type QuizQuestion = {
  id: number
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
  concept_tested: string
}

export type Assessment = {
  id: string
  topic: string
  questions: QuizQuestion[]
}

export type AssessmentResult = {
  score: number
  correct_count: number
  total_questions: number
  feedback: string
  misconceptions: string[]
  next_action: string
}

export type StudySession = {
  day: number
  subject: string
  topic: string
  duration_minutes: number
  completed: boolean
  priority?: string
}

export type StudyPlan = {
  id: string
  exam_date: string
  daily_minutes: number
  subjects: string[]
  sessions: StudySession[]
  created_at: string
}

export type ProgressTopic = {
  id: string
  topic: string
  mastery_score: number
  attempts_count: number
  last_studied: string
  misconceptions: string[]
}

export type LearningProgress = {
  assessments_completed: number
  average_score: number
  mastery_label: string
  streak_days: number
  topics: ProgressTopic[]
  misconceptions_detected: string[]
  recent_attempts: {
    score: number
    feedback: string
    created_at: string
    topic: string
    next_action: string
  }[]
}

export type UserProfile = {
  id: string
  name: string
  email: string
  token?: string
  preferences: {
    default_mode: TeachingMode
    preferred_language: string
    voice_speed: number
  }
}

