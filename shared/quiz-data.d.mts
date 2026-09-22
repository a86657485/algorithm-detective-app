export type QuizTag = 'concept' | 'stage' | 'kitchen' | 'addition' | 'twentyFour' | 'rectangle'

export interface QuizQuestion {
  id: string
  tag: QuizTag
  stem: string
  options: string[]
  answer: number
  explain: string
}

export interface PublicQuizQuestion {
  id: string
  tag: QuizTag
  stem: string
  options: string[]
}

export interface QuizDetailItem {
  id: string
  picked: number
  correct: number
  ok: boolean
}

export interface QuizResult {
  correct: number
  total: number
  score: number
  detail: QuizDetailItem[]
}

export declare const QUIZ_TAGS: Record<QuizTag, string>
export declare const QUIZ_QUESTIONS: QuizQuestion[]
export declare const QUIZ_TOTAL: number
export declare const QUIZ_MAX_SCORE: number
export declare function publicQuestions(): PublicQuizQuestion[]
export declare function gradeQuiz(answers: Record<string, number>): QuizResult
