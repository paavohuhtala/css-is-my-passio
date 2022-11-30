import type { Pattern } from "./sequencer";

export const DEFAULT_PATTERN_LENGTH = 16
export const ROUND_UP_TO = 16

export const getPaddedPatternLength = (lastNoteTime?: number | undefined) => {
  if (lastNoteTime === undefined) {
    return DEFAULT_PATTERN_LENGTH
  }

  return roundUpToMultipleOf(lastNoteTime, ROUND_UP_TO)
}

export const getPaddedPatternLengthFromPattern = (pattern: Pattern) => {
  const lastEventTime = pattern.events[pattern.events.length - 1] [0]
  return getPaddedPatternLength(lastEventTime)
}

export function roundUpToMultipleOf(value: number, multiple: number) {
  return Math.ceil(value / multiple) * multiple
}
