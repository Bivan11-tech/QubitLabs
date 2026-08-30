import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  name: string
  email: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  interests: string[]
  plan: string
  joinedAt: string
}

interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
  update: (patch: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      update: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : { user: null })),
    }),
    { name: 'qpl-auth' },
  ),
)