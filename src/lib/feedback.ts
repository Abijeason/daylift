import { FEEDBACK_FORM } from '../data/copy'

export type FeedbackAnswers = Partial<Record<keyof typeof FEEDBACK_FORM.fields, string>>

const MAX_LENGTH = 2000

export const hasAnswer = (a: FeedbackAnswers): boolean => Object.values(a).some(v => v?.trim())

export function feedbackBody(a: FeedbackAnswers): URLSearchParams {
  const body = new URLSearchParams()
  for (const [key, field] of Object.entries(FEEDBACK_FORM.fields)) {
    const value = a[key as keyof FeedbackAnswers]?.trim()
    if (value) body.append(field, value.slice(0, MAX_LENGTH))
  }
  return body
}

// Google Forms doesn't allow reading its reply from another site, so only a network failure can be detected.
export async function sendFeedback(a: FeedbackAnswers): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    await fetch(FEEDBACK_FORM.action, { method: 'POST', mode: 'no-cors', body: feedbackBody(a) })
    return true
  } catch {
    return false
  }
}
