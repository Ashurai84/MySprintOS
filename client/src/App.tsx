import React, { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { QuickAddTaskModal } from './components/QuickAddTaskModal'
import { QuickAddLectureModal } from './components/QuickAddLectureModal'
import { DashboardPage } from './pages/DashboardPage'
import { LecturesPage } from './pages/LecturesPage'
import { AttendancePage } from './pages/AttendancePage'
import { LearningPage } from './pages/LearningPage'
import { TasksPage } from './pages/TasksPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { DocumentsVaultPage } from './pages/DocumentsVaultPage'
import { RevisionPage } from './pages/RevisionPage'
import { CertificationsPage } from './pages/CertificationsPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimetablePage } from './pages/TimetablePage'
import { JavaRecoveryPage } from './pages/JavaRecoveryPage'
import type { Lecture } from './types'

const AppMain: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home')
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined)

  // Modals
  const [isLectureModalOpen, setIsLectureModalOpen] = useState<boolean>(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false)
  const [modalSubjectId, setModalSubjectId] = useState<string | undefined>(undefined)

  const handleNavigateToTab = (tab: string, subjectId?: string) => {
    if (subjectId) {
      setSelectedSubjectId(subjectId)
    }
    // Normalize aliases
    if (tab === 'dashboard') tab = 'home'
    if (tab === 'tasks') tab = 'assignments'
    setCurrentTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenQuickLecture = (subjectId?: string, lecture?: Lecture | null) => {
    setModalSubjectId(subjectId)
    setEditingLecture(lecture || null)
    setIsLectureModalOpen(true)
  }

  const handleOpenQuickTask = (subjectId?: string) => {
    setModalSubjectId(subjectId)
    setIsTaskModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Sticky Navbar */}
        <TopNav
          currentTab={currentTab}
          setIsMobileOpen={setIsMobileOpen}
          onOpenQuickLecture={() => handleOpenQuickLecture()}
          onOpenQuickTask={() => handleOpenQuickTask()}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* 1. Home Dashboard */}
          {(currentTab === 'home' || currentTab === 'dashboard') && (
            <DashboardPage
              onNavigateToTab={handleNavigateToTab}
              onOpenQuickLecture={() => handleOpenQuickLecture()}
              onOpenQuickTask={handleOpenQuickTask}
            />
          )}

          {/* Timetable & Faculty Management */}
          {currentTab === 'timetable' && (
            <TimetablePage
              onOpenQuickLecture={(subId) => handleOpenQuickLecture(subId)}
            />
          )}

          {/* 2. My Lectures */}
          {currentTab === 'lectures' && (
            <LecturesPage
              onOpenAddLecture={(subId) => handleOpenQuickLecture(subId)}
              onEditLecture={(lecture) => handleOpenQuickLecture(lecture.subjectId, lecture)}
            />
          )}

          {/* Java Fundamentals Recovery */}
          {currentTab === 'java-recovery' && (
            <JavaRecoveryPage
              onNavigateToRevision={() => handleNavigateToTab('revision')}
            />
          )}

          {/* 3. Attendance Verification */}
          {currentTab === 'attendance' && (
            <AttendancePage
              onOpenQuickLecture={(subId) => handleOpenQuickLecture(subId)}
              onNavigateToLectures={(subId) => handleNavigateToTab('lectures', subId)}
            />
          )}

          {/* 4. My Learning & Topic Mastery */}
          {currentTab === 'learning' && (
            <LearningPage
              onOpenQuickLecture={(subId) => handleOpenQuickLecture(subId)}
              onNavigateToRevision={() => handleNavigateToTab('revision')}
            />
          )}

          {/* 5. Assignments & Tasks */}
          {(currentTab === 'assignments' || currentTab === 'tasks') && (
            <TasksPage
              onOpenQuickTask={handleOpenQuickTask}
            />
          )}

          {/* 6. Subjects & Syllabus */}
          {currentTab === 'subjects' && (
            <SubjectsPage
              initialSubjectId={selectedSubjectId}
              onOpenQuickTask={handleOpenQuickTask}
            />
          )}

          {/* 7. Documents Vault */}
          {currentTab === 'documents' && (
            <DocumentsVaultPage />
          )}

          {/* 8. Revision & Progress */}
          {currentTab === 'revision' && (
            <RevisionPage
              onNavigateToLearning={() => handleNavigateToTab('learning')}
            />
          )}

          {/* 9. Settings */}
          {currentTab === 'settings' && (
            <SettingsPage />
          )}

          {/* Legacy secondary views */}
          {currentTab === 'certifications' && (
            <CertificationsPage />
          )}

          {currentTab === 'resources' && (
            <ResourcesPage />
          )}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <QuickAddLectureModal
        isOpen={isLectureModalOpen}
        onClose={() => {
          setIsLectureModalOpen(false)
          setEditingLecture(null)
        }}
        initialSubjectId={modalSubjectId}
        editingLecture={editingLecture}
      />

      <QuickAddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialSubjectId={modalSubjectId}
      />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppMain />
    </AppProvider>
  )
}

export default App

