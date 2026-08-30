import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import GuestLayout from './components/layout/GuestLayout'
import AppShell from './components/layout/AppShell'
import { useAuthStore } from './store/authStore'

import LandingPage from './pages/LandingPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import OnboardingPage from './features/auth/OnboardingPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './features/dashboard/DashboardPage'
import CoursesPage from './features/learning/CoursesPage'
import LessonPage from './features/learning/LessonPage'
import LabPage from './features/lab/LabPage'
import ChallengesPage from './features/challenges/ChallengesPage'
import ChallengePage from './features/challenges/ChallengePage'
import TutorPage from './features/tutor/TutorPage'
import ProgressPage from './features/progress/ProgressPage'
import ProfilePage from './features/profile/ProfilePage'
import InstructorPage from './features/instructor/InstructorPage'

function Protected({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      <Route element={<Protected><AppShell /></Protected>}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/learn" element={<CoursesPage />} />
        <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenges/:challengeId" element={<ChallengePage />} />
        <Route path="/tutor" element={<TutorPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/instructor" element={<InstructorPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App