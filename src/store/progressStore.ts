import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Badge {
  id: string
  label: string
  icon: string
  earned: boolean
}

export interface LessonCompletion {
  courseId: string
  lessonId: string
  at: number
}

interface ProgressState {
  xp: number
  streak: number
  completed: Record<string, string[]> // courseId -> lessonIds
  completedChallenges: string[]
  badges: Badge[]
  quizScores: Record<string, number>
  completeLesson: (courseId: string, lessonId: string, xpGain: number) => void
  completeChallenge: (id: string, xpGain: number, badgeId?: string) => void
  recordQuiz: (lessonId: string, score: number) => void
  bumpStreak: () => void
  reset: () => void
}

const ALL_BADGES: Badge[] = [
  { id: 'first-qubit', label: 'First Steps', icon: '🥇', earned: false },
  { id: 'superposer', label: 'Superposicionista', icon: '🌊', earned: false },
  { id: 'entangler', label: 'Entangler', icon: '🔗', earned: false },
  { id: 'bell-builder', label: 'Bell Builder', icon: '🔔', earned: false },
  { id: 'lab-rat', label: 'Lab Rat', icon: '🧪', earned: false },
  { id: 'circuit-artist', label: 'Circuit Artist', icon: '🎨', earned: false },
  { id: 'grokker', label: 'Algorithm Grokker', icon: '🧠', earned: false },
  { id: 'seven-day', label: '7-Day Streak', icon: '🔥', earned: false },
]

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      xp: 1250,
      streak: 6,
      completed: {
        fundamentals: ['qubit', 'superposition'],
      },
      completedChallenges: [],
      badges: ALL_BADGES,
      quizScores: {},

      completeLesson: (courseId, lessonId, xpGain) =>
        set((s) => {
          const list = s.completed[courseId] ?? []
          if (list.includes(lessonId)) return s
          return {
            ...s,
            completed: { ...s.completed, [courseId]: [...list, lessonId] },
            xp: s.xp + xpGain,
          }
        }),

      completeChallenge: (id, xpGain, badgeId) =>
        set((s) => {
          if (s.completedChallenges.includes(id)) return s
          return {
            ...s,
            completedChallenges: [...s.completedChallenges, id],
            xp: s.xp + xpGain,
            badges: s.badges.map((b) => (b.id === badgeId ? { ...b, earned: true } : b)),
          }
        }),

      recordQuiz: (lessonId, score) =>
        set((s) => ({ ...s, quizScores: { ...s.quizScores, [lessonId]: score } })),
      bumpStreak: () => set((s) => ({ streak: s.streak + 1 })),
      reset: () =>
        set({ xp: 0, streak: 0, completed: {}, completedChallenges: [], badges: ALL_BADGES, quizScores: {} }),
    }),
    { name: 'qpl-progress' },
  ),
)

export function lessonDone(completed: Record<string, string[]>, courseId: string, lessonId: string): boolean {
  return (completed[courseId] ?? []).includes(lessonId)
}

export function coursePercent(completed: Record<string, string[]>, courseId: string, total: number): number {
  const done = (completed[courseId] ?? []).length
  return Math.round((done / total) * 100)
}