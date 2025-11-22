import { useState } from 'react'
import { InterviewAiPage } from './pages/InterviewAiPage'
import { LessonLibraryPage } from './pages/LessonLibraryPage'
import { SidebarNav } from './components/SidebarNav'
import type { Lesson } from './types'
import { UserProfilePage } from './pages/UserProfilePage'
import './App.css'

const PAGE_LABELS = {
  home: 'Home',
  training1v1: '1v1 Training',
  library: 'Lesson Library',
  calendar: 'Calendar',
  analytics: 'Analytics',
  support: 'Support',
  settings: 'Settings',
  logout: 'Log out',
} as const

type NavId = keyof typeof PAGE_LABELS

type ViewState =
  | { type: 'library' }
  | { type: 'interview'; lesson: Lesson }
  | { type: 'placeholder'; navId: NavId }
  | { type: 'profile' }

function App() {
  const [activeNav, setActiveNav] = useState<NavId | null>('library')
  const [view, setView] = useState<ViewState>({ type: 'library' })

  const handleNavChange = (nextId: NavId) => {
    setActiveNav(nextId)
    if (nextId === 'library') {
      setView({ type: 'library' })
      return
    }

    setView({ type: 'placeholder', navId: nextId })
  }

  const handleOpenLesson = (lesson: Lesson) => {
    setActiveNav('library')
    setView({ type: 'interview', lesson })
  }

  const handleBackToLibrary = () => {
    setActiveNav('library')
    setView({ type: 'library' })
  }

  const handleOpenProfile = () => {
    setActiveNav(null)
    setView({ type: 'profile' })
  }

  const renderContent = () => {
    switch (view.type) {
      case 'interview':
        return <InterviewAiPage lesson={view.lesson} onBack={handleBackToLibrary} />
      case 'library':
        return <LessonLibraryPage onOpenLesson={handleOpenLesson} />
      case 'profile':
        return <UserProfilePage onBack={handleBackToLibrary} />
      case 'placeholder':
      default: {
        const pendingLabel = PAGE_LABELS[view.navId] ?? view.navId
        return (
          <section className="app-placeholder" aria-live="polite">
            <p>Tính năng “{pendingLabel}” sẽ ra mắt sớm.</p>
          </section>
        )
      }
    }
  }

  return (
    <div className="app-shell">
      <SidebarNav activeId={activeNav ?? undefined} onChange={handleNavChange} onAvatarClick={handleOpenProfile} />
      <main className="app-main">{renderContent()}</main>
    </div>
  )
}

export default App
