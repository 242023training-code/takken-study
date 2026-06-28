export type Category = '権利関係' | '宅建業法' | '法令上の制限' | '税・その他'

export interface Question {
  id: string
  question: string
  choices: string[]
  correct_answer: number
  explanation: string
  category: Category
  difficulty: number
  year: number | null
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  notification_time: string | null
  notification_enabled: boolean
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  started_at: string
  completed_at: string | null
  question_count: number
}

export interface AnswerHistory {
  id: string
  user_id: string
  question_id: string
  session_id: string | null
  is_correct: boolean
  selected_answer: number
  answered_at: string
}

export interface AnswerHistoryWithQuestion extends AnswerHistory {
  questions: Question
}

export interface ReviewItem {
  id: string
  user_id: string
  question_id: string
  added_at: string
}

export interface ReviewItemWithQuestion extends ReviewItem {
  questions: Question
}

export interface SessionAnswer {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
}

export interface StudyStats {
  totalAnswers: number
  correctAnswers: number
  correctRate: number
  streakDays: number
  todayAnswers: number
}
