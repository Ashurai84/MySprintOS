import type { TutorMode, TutorCitation } from '../types'

export interface TutorApiRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  mode: TutorMode
  subjectId?: string
  subjectName?: string
  topicTitle?: string
  retrievedContext?: string
}

export interface TutorApiResponse {
  success: boolean
  content?: string
  citations?: TutorCitation[]
  hasGrounding?: boolean
  groundingNote?: string
  errorType?: string
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/**
 * Sends a message sequence to the SprintOS AI Tutor backend
 */
export async function sendTutorChatMessage(req: TutorApiRequest): Promise<TutorApiResponse> {
  const endpoint = `${API_BASE_URL}/ai/tutor/chat`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 40000) // 40s timeout

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: req.messages,
        mode: req.mode,
        subjectId: req.subjectId || '',
        subjectName: req.subjectName || '',
        topicTitle: req.topicTitle || '',
        retrievedContext: req.retrievedContext || ''
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    const data = await response.json()
    if (!response.ok || !data.success) {
      return {
        success: false,
        errorType: data.errorType || `HTTP_${response.status}`,
        message: data.message || `Server returned error (${response.status})`
      }
    }

    return {
      success: true,
      content: data.content,
      citations: data.citations || [],
      hasGrounding: Boolean(data.hasGrounding),
      groundingNote: data.groundingNote
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        errorType: 'TIMEOUT',
        message: 'The AI Tutor request timed out after 40 seconds. Please try again with a shorter message.'
      }
    }

    // Network error (e.g. server is not running)
    return {
      success: false,
      errorType: 'SERVER_OFFLINE',
      message: 'Could not connect to the SprintOS backend (http://localhost:3001). Please ensure "npm run server" is running in a terminal.'
    }
  }
}
