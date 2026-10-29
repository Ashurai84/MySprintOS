import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bot,
  Layers
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { TutorMode } from '../types'
import { TutorContextBar, TUTOR_MODES } from '../components/tutor/TutorContextBar'
import { TutorMessageItem } from '../components/tutor/TutorMessageItem'
import { sendTutorChatMessage } from '../services/tutorApiService'

export const TutorPage: React.FC = () => {
  const {
    subjects,
    tutorSessions,
    activeTutorSessionId,
    setActiveTutorSessionId,
    createTutorSession,
    addMessageToTutorSession,
    deleteTutorSession,
    updateTutorSessionContext
  } = useApp()

  // Input state
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Current active session
  const activeSession = tutorSessions.find(s => s.id === activeTutorSessionId) || tutorSessions[0]

  // If no sessions exist, auto-create one with first subject and first topic
  useEffect(() => {
    if (tutorSessions.length === 0 && subjects.length > 0) {
      const firstSub = subjects[0]
      const firstTopic = firstSub?.modules?.[0]?.topics?.[0]
      createTutorSession(
        firstSub.id,
        firstTopic?.id,
        firstTopic?.title,
        'explain_simply'
      )
    } else if (!activeTutorSessionId && tutorSessions.length > 0) {
      setActiveTutorSessionId(tutorSessions[0].id)
    }
  }, [tutorSessions, activeTutorSessionId, subjects, createTutorSession, setActiveTutorSessionId])

  // If active session has subject but no topic, automatically assign the first topic
  useEffect(() => {
    if (activeSession && activeSession.subjectId && !activeSession.topicId) {
      const curSub = subjects.find(s => s.id === activeSession.subjectId)
      const firstTopic = curSub?.modules?.[0]?.topics?.[0]
      if (firstTopic) {
        updateTutorSessionContext(activeSession.id, {
          topicId: firstTopic.id,
          topicTitle: firstTopic.title
        })
      }
    }
  }, [activeSession, subjects, updateTutorSessionContext])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, isLoading])

  const handleSelectSubject = (subjectId: string) => {
    if (!activeSession) return
    const sub = subjects.find(s => s.id === subjectId)
    const firstTopic = sub?.modules?.[0]?.topics?.[0]
    updateTutorSessionContext(activeSession.id, {
      subjectId: subjectId || undefined,
      topicId: firstTopic?.id || undefined,
      topicTitle: firstTopic?.title || undefined
    })
  }

  const handleSelectTopic = (topicId: string, topicTitle: string) => {
    if (!activeSession) return
    updateTutorSessionContext(activeSession.id, {
      topicId: topicId || undefined,
      topicTitle: topicTitle || undefined
    })
  }

  const handleSelectMode = (mode: TutorMode) => {
    if (!activeSession) return
    updateTutorSessionContext(activeSession.id, { mode })
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text || isLoading || !activeSession) return

    setInputText('')
    setIsLoading(true)

    // 1. Append user message to session
    addMessageToTutorSession(activeSession.id, {
      role: 'user',
      content: text
    })

    // 2. Prepare message history for backend
    const currentMessages = activeSession.messages.map(m => ({
      role: m.role,
      content: m.content
    }))
    currentMessages.push({ role: 'user', content: text })

    const subjectObj = subjects.find(s => s.id === activeSession.subjectId)
    const subjectName = subjectObj?.name || ''
    const topicTitle = activeSession.topicTitle || subjectObj?.modules?.[0]?.topics?.[0]?.title || ''

    // 3. Call backend Groq Tutor endpoint
    const response = await sendTutorChatMessage({
      messages: currentMessages,
      mode: activeSession.mode,
      subjectId: activeSession.subjectId,
      subjectName,
      topicTitle
    })

    if (response.success && response.content) {
      addMessageToTutorSession(activeSession.id, {
        role: 'assistant',
        content: response.content,
        mode: activeSession.mode,
        citations: response.citations,
        hasGrounding: response.hasGrounding,
        groundingNote: response.groundingNote
      })
    } else {
      addMessageToTutorSession(activeSession.id, {
        role: 'assistant',
        content: response.message || 'An error occurred while communicating with the AI Tutor.',
        isError: true,
        mode: activeSession.mode
      })
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStartNewSession = () => {
    const currentSub = subjects.find(s => s.id === activeSession?.subjectId) || subjects[0]
    const firstTopic = currentSub?.modules?.[0]?.topics?.[0]
    createTutorSession(
      currentSub?.id,
      firstTopic?.id,
      firstTopic?.title,
      activeSession?.mode || 'explain_simply'
    )
  }

  // Active subject & topic names for high-precision prompt generation
  const activeSubjectObj = subjects.find(s => s.id === activeSession?.subjectId) || subjects[0]
  const activeSubjectName = activeSubjectObj?.name || 'Data Structures and Algorithms III'
  const fallbackTopicTitle = activeSubjectObj?.modules?.[0]?.topics?.[0]?.title || 'Core Foundation'
  const currentTargetTopic = activeSession?.topicTitle || fallbackTopicTitle

  // Preset prompt chips for quick discovery adapted to active mode (ALWAYS targets concrete topic)
  const modeActionChips = React.useMemo(() => {
    const topic = currentTargetTopic
    const subName = activeSubjectName

    switch (activeSession?.mode) {
      case 'coding_practice':
        return [
          { label: 'Request Hint 1', prompt: `Give me Hint 1 on the optimal approach for ${topic} in ${subName}. Do not reveal the full code.` },
          { label: 'Show Dry-Run Table', prompt: `Walk me through a small example input for ${topic} in ${subName} with a step-by-step trace table showing intermediate variable changes.` },
          { label: 'Reveal Full Solution', prompt: `Please reveal the complete, clean solution code for ${topic} in ${subName} with detailed comments and edge case handling.` },
          { label: 'Analyze Complexity', prompt: `Analyze the time complexity and space complexity of ${topic} in ${subName} with Big-O derivation.` }
        ]
      case 'revision':
        return [
          { label: 'Start Active Recall', prompt: `Give me an active-recall practice question to test my understanding of ${topic} in ${subName}. Do not reveal the answer yet.` },
          { label: 'Check Invariants', prompt: `What are the core invariants, mathematical properties, or rules I need to remember for ${topic} in ${subName}?` },
          { label: 'Common Pitfalls', prompt: `What are the most common exam mistakes or conceptual misunderstandings students make about ${topic} in ${subName}?` },
          { label: 'Next Question', prompt: `Give me another targeted recall question on ${topic} in ${subName} to test my mastery.` }
        ]
      case 'exam_prep':
        return [
          { label: '2-Mark Conceptual', prompt: `Generate a 2-mark university semester exam question on ${topic} in ${subName}. Prompt me to answer first.` },
          { label: 'University MCQ', prompt: `Generate a 4-option multiple choice question (MCQ) on ${topic} in ${subName} with plausible distractors.` },
          { label: '5/10-Mark Question', prompt: `Generate a 5 or 10-mark analytical exam question on ${topic} in ${subName} with an answer rubric.` },
          { label: 'Grade My Answer', prompt: `I will provide my answer to the previous question on ${topic}. Please evaluate it against university marking criteria.` }
        ]
      case 'step_by_step':
        return [
          { label: 'Step 1: Objective', prompt: `What is Step 1 in breaking down ${topic} in ${subName}? State the objective and invariants.` },
          { label: 'Step-by-Step Walkthrough', prompt: `Break down the algorithm or procedure for ${topic} in ${subName} into discrete numbered steps.` },
          { label: 'Edge Cases', prompt: `What boundary conditions or edge cases must be handled for ${topic} in ${subName}?` },
          { label: 'Complexity Derivation', prompt: `Derive the time and space complexity of ${topic} step-by-step.` }
        ]
      case 'btech_student':
        return [
          { label: 'Exam Structure', prompt: `Structure a comprehensive semester-exam answer for ${topic} in ${subName} (Definition, Key Points, Architecture/Diagram description, Advantages/Disadvantages).` },
          { label: 'Trade-offs', prompt: `What are the trade-offs, advantages, and limitations of ${topic} in ${subName}?` },
          { label: 'Architecture & Mechanics', prompt: `Explain the operational mechanics and internal architecture of ${topic} in ${subName} at an undergraduate level.` },
          { label: 'Syllabus Alignment', prompt: `What does the university syllabus recommend regarding ${topic} in ${subName}?` }
        ]
      case 'explain_simply':
      default:
        return [
          { label: 'Everyday Analogy', prompt: `Explain ${topic} in ${subName} using a simple, relatable real-world everyday analogy.` },
          { label: 'Explain in Plain English', prompt: `Explain ${topic} in ${subName} in extremely simple language without overwhelming jargon.` },
          { label: 'Concrete Example', prompt: `Give me a small, concrete everyday example demonstrating ${topic} in ${subName}.` },
          { label: 'Check My Understanding', prompt: `Ask me a simple check-question to see if I understood ${topic} in ${subName}.` }
        ]
    }
  }, [activeSession?.mode, currentTargetTopic, activeSubjectName])

  const activeModeObj = TUTOR_MODES.find(m => m.id === activeSession?.mode) || TUTOR_MODES[0]

  return (
    <div className="flex h-[calc(100vh-5.5rem)] border border-zinc-200/90 rounded-2xl bg-[#fafafa] overflow-hidden shadow-sm">
      {/* LEFT: Conversation History Sidebar */}
      <div
        className={`${isSidebarOpen ? 'w-64 sm:w-72' : 'w-0'
          } transition-all duration-200 border-r border-zinc-200/80 bg-white flex flex-col shrink-0 overflow-hidden`}
      >
        {/* New Session Button */}
        <div className="p-3 border-b border-zinc-200/80">
          <button
            type="button"
            onClick={handleStartNewSession}
            className="w-full py-2.5 px-3 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Tutoring Session</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
            Previous Sessions ({tutorSessions.length})
          </div>

          {tutorSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              No sessions yet. Start a new session above.
            </div>
          ) : (
            tutorSessions.map(session => {
              const isActive = session.id === activeSession?.id
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveTutorSessionId(session.id)}
                  className={`group p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${isActive
                    ? 'bg-black text-white font-semibold shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-xs">{session.title}</p>
                      {session.subjectName && (
                        <p className={`text-[10px] font-mono truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {session.subjectName}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTutorSession(session.id)
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${isActive ? 'text-zinc-300 hover:text-white' : 'text-zinc-400 hover:text-red-600'
                      }`}
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Storage Integrity Notice */}
        <div className="p-3 border-t border-zinc-200/80 bg-zinc-50 text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
          <span>Sessions securely preserved in local device storage.</span>
        </div>
      </div>

      {/* RIGHT: Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
        {/* Toggle history & Context bar */}
        <div className="flex items-center border-b border-zinc-200/80 bg-white">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 text-zinc-500 hover:text-black border-r border-zinc-200/80 hover:bg-zinc-100 transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Collapse session history' : 'Expand session history'}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <TutorContextBar
              subjects={subjects}
              selectedSubjectId={activeSession?.subjectId || ''}
              selectedTopicId={activeSession?.topicId || ''}
              mode={activeSession?.mode || 'explain_simply'}
              onSelectSubject={handleSelectSubject}
              onSelectTopic={handleSelectTopic}
              onSelectMode={handleSelectMode}
            />
          </div>
        </div>

        {/* Active Focus Pill */}
        <div className="px-4 py-2 border-b border-zinc-200/60 bg-white/70 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="text-zinc-500 font-medium">Topic Focus:</span>
            <span className="font-semibold text-zinc-950 truncate max-w-[400px]">
              {currentTargetTopic}
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">({activeSubjectName})</span>
          </div>
          <button
            type="button"
            onClick={handleStartNewSession}
            className="text-[11px] font-semibold text-zinc-700 hover:text-black font-mono flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Transcript / Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#fafafa]">
          {(!activeSession || activeSession.messages.length === 0) ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                <Bot className="w-6 h-6 text-white" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-950">
                  SprintOS AI Tutor
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Your personalized Semester 5 B.Tech study partner. Ask any question, explore curriculum topics, or request step-by-step problem breakdowns.
                </p>
                <div className="pt-1">
                  <span className="inline-block text-[11px] font-mono px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-800 shadow-xs">
                    Current Focus: <strong className="text-black font-semibold">{currentTargetTopic}</strong> • Mode: <strong className="text-black font-semibold">{activeModeObj.label}</strong>
                  </span>
                </div>
              </div>

              {/* Starter chips */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider text-left pl-1 font-semibold">
                  Quick Exploration Steps:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {modeActionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip.prompt)}
                      className="p-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 transition-all text-left flex items-start gap-2 cursor-pointer shadow-xs hover:border-zinc-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-bold text-zinc-950 block">{chip.label}</span>
                        <span className="text-[11px] text-zinc-500 block line-clamp-2 leading-snug">{chip.prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeSession.messages.map(msg => (
                <TutorMessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={() => {
                    const lastUserMsg = [...activeSession.messages].reverse().find(m => m.role === 'user')
                    if (lastUserMsg) {
                      handleSendMessage(lastUserMsg.content)
                    }
                  }}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 text-xs text-zinc-600 py-2 animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                  </div>
                  <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
                    <span className="text-zinc-800 font-medium">Synthesizing tutor response via Groq LPU...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-200/80 bg-white space-y-2.5">
          {/* Quick Action Chips for Current Mode */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 mr-0.5 font-semibold">
              {activeModeObj.label}:
            </span>
            {modeActionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isLoading}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 hover:text-black border border-zinc-200 transition-colors shrink-0 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-end gap-2 bg-zinc-50/80 border border-zinc-200 rounded-2xl p-2.5 focus-within:bg-white focus-within:border-black focus-within:ring-2 focus-within:ring-black/5 transition-all shadow-xs">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask tutor about ${currentTargetTopic}... (Shift+Enter for newline)`}
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none px-2 py-1 leading-relaxed"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-black text-white hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0 shadow-xs cursor-pointer flex items-center justify-center font-semibold"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>Press <kbd className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px] text-zinc-700 font-semibold">Enter</kbd> to send, <kbd className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px] text-zinc-700 font-semibold">Shift + Enter</kbd> for newline</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-black inline-block animate-pulse" />
              <span>Groq LPU Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}