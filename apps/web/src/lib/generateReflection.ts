/**
 * Generates a short 1–2 sentence Lumyn reflection for a completed reading.
 * Called silently in the background after a reading saves to localStorage.
 */

import { callVybeReading } from './vybeApi'

/**
 * Generate a short Lumyn reflection for a reading.
 * Returns the reflection text, or null on failure.
 */
export async function generateReflection(
  inputValue: string,
  readingExcerpt: string
): Promise<string | null> {
  try {
    const excerpt = readingExcerpt.slice(0, 600).replace(/\n+/g, ' ')
    const text = await callVybeReading(
      [
        { label: 'CapturedValue', value: inputValue },
        { label: 'ReadingExcerpt', value: excerpt },
        {
          label: 'ReflectionInstruction',
          value:
            'Write exactly ONE sentence (20–35 words) as Lumyn — intimate, specific, speaking directly to the person about what this reading reveals. No greetings. No generic affirmations. Reference the specific number or energy captured.',
        },
      ],
      'lite'
    )
    // Strip any markdown/structure — we just want the raw sentence
    const cleaned = text
      .replace(/^#+.*/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^\s*[-•]\s*/gm, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10)
      .find(l => l.length > 0) ?? null
    return cleaned
  } catch {
    return null
  }
}
