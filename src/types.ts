export type LessonCategory = 'jobs' | 'scholarship' | 'startup' | 'softskills'

export type LessonDifficulty = 'Dễ' | 'Trung cấp' | 'Nâng cao' | (string & {})

export interface LessonReview {
  id: string
  name: string
  role?: string
  timeAgo?: string
  rating: number
  comment: string
  avatarColor?: string
  initials?: string
}

export interface Lesson {
  id: string
  title: string
  views: number
  rating: number
  reviewCount?: number
  duration?: string
  difficulty?: LessonDifficulty
  tags?: string[]
  category: LessonCategory
  reviews?: LessonReview[]
}
