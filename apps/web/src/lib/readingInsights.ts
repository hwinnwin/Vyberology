/**
 * Reading Pattern Intelligence
 * Analyses localStorage reading history to generate cross-reading insights
 * that make Lumyn feel like it truly knows the user's journey.
 */

import { getReadingHistory, type HistoricalReading } from './readingHistory'

export interface PatternInsight {
  type: 'dominant_number' | 'chakra_streak' | 'element_streak' | 'returning_number' | 'frequency_spike'
  label: string
  detail: string
  count: number
  significance: 'high' | 'medium' | 'low'
}

export interface ReadingInsightSummary {
  totalReadings: number
  readingsThisWeek: number
  readingsThisMonth: number
  dominantNumbers: { number: string; count: number }[]
  topPatterns: { pattern: string; count: number }[]
  insights: PatternInsight[]
  /** Plain-text summary ready to inject into Lumyn context */
  contextSummary: string
  lastReadingAt: string | null
  daysSinceLastReading: number | null
}

/**
 * Extract chakra name from reading text (looks for chakra markers in the reading)
 */
function extractChakra(reading: string): string | null {
  const chakras = ['Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat', 'Third Eye', 'Crown']
  const lower = reading.toLowerCase()
  for (const c of chakras) {
    if (lower.includes(c.toLowerCase())) return c
  }
  return null
}

/**
 * Extract element from reading text
 */
function extractElement(reading: string): string | null {
  const elements = ['Fire', 'Earth', 'Air', 'Water']
  const lower = reading.toLowerCase()
  for (const e of elements) {
    if (lower.includes(e.toLowerCase())) return e
  }
  return null
}

/**
 * Analyse reading history and return rich pattern intelligence
 */
export function analyseReadingPatterns(): ReadingInsightSummary {
  const history = getReadingHistory()

  if (history.length === 0) {
    return {
      totalReadings: 0,
      readingsThisWeek: 0,
      readingsThisMonth: 0,
      dominantNumbers: [],
      topPatterns: [],
      insights: [],
      contextSummary: 'No readings yet.',
      lastReadingAt: null,
      daysSinceLastReading: null,
    }
  }

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const readingsThisWeek = history.filter(r => new Date(r.timestamp) >= oneWeekAgo).length
  const readingsThisMonth = history.filter(r => new Date(r.timestamp) >= oneMonthAgo).length

  // Last reading
  const lastReadingAt = history[0]?.timestamp ?? null
  const daysSinceLastReading = lastReadingAt
    ? Math.floor((now.getTime() - new Date(lastReadingAt).getTime()) / 86400000)
    : null

  // Number frequency across all inputs
  const numberCount: Record<string, number> = {}
  for (const r of history) {
    const nums = r.inputValue.match(/\d+/g) ?? []
    for (const n of nums) {
      numberCount[n] = (numberCount[n] || 0) + 1
    }
    if (r.numbers) {
      for (const n of r.numbers) {
        numberCount[n] = (numberCount[n] || 0) + 1
      }
    }
  }

  const dominantNumbers = Object.entries(numberCount)
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topPatterns = dominantNumbers.slice(0, 8).map(d => ({ pattern: d.number, count: d.count }))

  // Chakra frequency
  const chakraCount: Record<string, number> = {}
  for (const r of history) {
    const c = extractChakra(r.reading)
    if (c) chakraCount[c] = (chakraCount[c] || 0) + 1
  }

  // Element frequency
  const elementCount: Record<string, number> = {}
  for (const r of history) {
    const e = extractElement(r.reading)
    if (e) elementCount[e] = (elementCount[e] || 0) + 1
  }

  // Build insights
  const insights: PatternInsight[] = []

  // Dominant number insight
  if (dominantNumbers[0]?.count >= 3) {
    const d = dominantNumbers[0]
    insights.push({
      type: 'dominant_number',
      label: `${d.number} is your dominant frequency`,
      detail: `You've captured ${d.number} ${d.count} times — this number is calling for your attention.`,
      count: d.count,
      significance: d.count >= 5 ? 'high' : 'medium',
    })
  }

  // Returning number — same number appearing in last 3 readings
  const last3 = history.slice(0, 3)
  const last3Numbers = last3.flatMap(r => r.inputValue.match(/\d+/g) ?? [])
  const recentRepeat = last3Numbers.find(n => last3Numbers.filter(x => x === n).length >= 2)
  if (recentRepeat) {
    insights.push({
      type: 'returning_number',
      label: `${recentRepeat} keeps returning`,
      detail: `${recentRepeat} has appeared in your last few captures — it may have something unresolved to tell you.`,
      count: last3Numbers.filter(x => x === recentRepeat).length,
      significance: 'high',
    })
  }

  // Chakra streak
  const dominantChakra = Object.entries(chakraCount).sort((a, b) => b[1] - a[1])[0]
  if (dominantChakra && dominantChakra[1] >= 3) {
    insights.push({
      type: 'chakra_streak',
      label: `${dominantChakra[0]} chakra is active`,
      detail: `Your readings have touched the ${dominantChakra[0]} chakra ${dominantChakra[1]} times — this energy centre is prominent in your current cycle.`,
      count: dominantChakra[1],
      significance: dominantChakra[1] >= 5 ? 'high' : 'medium',
    })
  }

  // Element streak
  const dominantElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0]
  if (dominantElement && dominantElement[1] >= 3) {
    insights.push({
      type: 'element_streak',
      label: `${dominantElement[0]} element dominates`,
      detail: `${dominantElement[0]} energy has shown up in ${dominantElement[1]} of your readings — you're in a ${dominantElement[0].toLowerCase()} cycle.`,
      count: dominantElement[1],
      significance: 'medium',
    })
  }

  // Frequency spike this week vs average
  const avgPerWeek = history.length / Math.max(1, Math.ceil(
    (now.getTime() - new Date(history[history.length - 1].timestamp).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ))
  if (readingsThisWeek > avgPerWeek * 1.5 && readingsThisWeek >= 3) {
    insights.push({
      type: 'frequency_spike',
      label: 'Heightened awareness this week',
      detail: `You've captured ${readingsThisWeek} readings this week — more than usual. Something is pulling you to tune in.`,
      count: readingsThisWeek,
      significance: 'medium',
    })
  }

  // Build plain-text context summary for Lumyn
  const lines: string[] = []
  lines.push(`Total vybe captures: ${history.length}`)
  lines.push(`Captures this week: ${readingsThisWeek}, this month: ${readingsThisMonth}`)

  if (lastReadingAt) {
    const label = daysSinceLastReading === 0
      ? 'today'
      : daysSinceLastReading === 1
        ? 'yesterday'
        : `${daysSinceLastReading} days ago`
    const lastVal = history[0].inputValue
    const lastChakra = extractChakra(history[0].reading)
    lines.push(`Last reading: ${label} (captured "${lastVal}"${lastChakra ? `, ${lastChakra} chakra` : ''})`)
  }

  if (dominantNumbers.length > 0) {
    lines.push(`Most frequent numbers: ${dominantNumbers.slice(0, 3).map(d => `${d.number} (${d.count}×)`).join(', ')}`)
  }

  if (dominantChakra) {
    lines.push(`Most active chakra: ${dominantChakra[0]} (${dominantChakra[1]} readings)`)
  }

  if (dominantElement) {
    lines.push(`Dominant element: ${dominantElement[0]} (${dominantElement[1]} readings)`)
  }

  if (insights.length > 0) {
    lines.push('Patterns detected:')
    for (const ins of insights) {
      lines.push(`  • ${ins.detail}`)
    }
  }

  // Add last 3 reading snapshots for Lumyn to reference
  lines.push('Most recent captures:')
  for (const r of history.slice(0, 3)) {
    const date = new Date(r.timestamp).toLocaleDateString()
    const excerpt = r.reading.slice(0, 150).replace(/\n+/g, ' ')
    const reflection = (r as HistoricalReading & { reflection?: string }).reflection
    lines.push(`  [${date}] "${r.inputValue}" — ${excerpt}${reflection ? ` | Lumyn said: "${reflection}"` : ''}`)
  }

  return {
    totalReadings: history.length,
    readingsThisWeek,
    readingsThisMonth,
    dominantNumbers,
    topPatterns,
    insights,
    contextSummary: lines.join('\n'),
    lastReadingAt,
    daysSinceLastReading,
  }
}

/**
 * Build a personalised Lumyn greeting based on reading history.
 * Returns null if no history (blank chat is fine).
 */
export function buildLumynGreeting(displayName?: string): string | null {
  const summary = analyseReadingPatterns()
  if (summary.totalReadings === 0) return null

  const name = displayName ? `, ${displayName.split(' ')[0]}` : ''

  // Build greeting based on recency + patterns
  const parts: string[] = []

  if (summary.daysSinceLastReading === 0) {
    parts.push(`Welcome back${name}.`)
  } else if (summary.daysSinceLastReading === 1) {
    parts.push(`Good to see you again${name}.`)
  } else if (summary.daysSinceLastReading !== null && summary.daysSinceLastReading <= 7) {
    parts.push(`It's been ${summary.daysSinceLastReading} days${name}.`)
  } else if (summary.daysSinceLastReading !== null) {
    parts.push(`You've been away for a little while${name} — welcome back.`)
  }

  // Reference last reading
  if (summary.lastReadingAt) {
    const last = getReadingHistory()[0]
    if (last) {
      const reflection = (last as HistoricalReading & { reflection?: string }).reflection
      if (reflection) {
        parts.push(`Last time you captured "${last.inputValue}" and I noticed: *${reflection}*`)
      } else {
        parts.push(`Last time you captured "${last.inputValue}".`)
      }
    }
  }

  // Surface a strong pattern
  const topInsight = summary.insights.find(i => i.significance === 'high') ?? summary.insights[0]
  if (topInsight) {
    parts.push(topInsight.detail)
  }

  parts.push("What's alive for you today?")

  return parts.join(' ')
}
