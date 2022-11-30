import { InstrumentEventAtTime, InstrumentId, NOP } from "./instrument";
import { getPaddedPatternLengthFromPattern } from "./utils";

export interface Pattern {
  events: InstrumentEventAtTime[]
  instrumentId: InstrumentId
  playOnce?: boolean
} 

export function undelta(sequence: Pattern): Pattern {
  let totalTime = 0

  return {
    ...sequence,
    events: sequence.events.map(([delta, event]) => {
      totalTime += delta
      return [totalTime, event]
    })
  }
}

export function addOffset(offset: number, events: Pattern): Pattern {
  return {
    ...events,
    events: events.events.map(([time, event]) => [time + offset, event])
  }
}

export function concatPatterns(instrumentId: InstrumentId, ...patterns: Pattern[]): Pattern {
  const events: InstrumentEventAtTime[] = []

  let totalTime = 0

  for (const pattern of patterns) {
    const patternLength = getPaddedPatternLengthFromPattern(pattern)
    events.push(...addOffset(totalTime, pattern).events)
    totalTime += patternLength
  }

  return {
    events,
    instrumentId
  }
}


export function repeat(times: number, pattern: Pattern): Pattern {
  const events: InstrumentEventAtTime[] = []
  const patternLength = getPaddedPatternLengthFromPattern(pattern)

  let totalTime = 0

  for (let i = 0; i < times; i++) {
    events.push(...addOffset(totalTime, pattern).events)
    totalTime += patternLength
  }

  return {
    ...pattern,
    events,
  }
}

export function combine(...patterns: Pattern[]): Pattern {
  const events: InstrumentEventAtTime[] = []

  for (const pattern of patterns) {
    events.push(...pattern.events)
  }

  events.sort((a, b) => a[0] - b[0])

  return {
    ...patterns[0],
    events,
  }
}

const SILENT_BEAT: Pattern = {
  events: [[1, [NOP]]],
  instrumentId: 0,
}

export function silence(duration: number): Pattern {
  return repeat(duration, SILENT_BEAT)
}
