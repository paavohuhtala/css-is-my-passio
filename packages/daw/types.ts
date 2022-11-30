import { INSTRUMENT_DRUMS, INSTRUMENT_PAD, INSTRUMENT_PWM_LEAD, INSTRUMENT_PWM_LEAD_ARP, INSTRUMENT_REESE } from "../../src/music/instrument"
import { DEFAULT_PATTERN_LENGTH, ROUND_UP_TO, roundUpToMultipleOf } from "../../src/music/utils"

export const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const

export type KeyName = typeof keys[number]

export type KeyInfo = {
  name: KeyName
  octave: number
}

export interface DawNote {
  id: string
  
  // Note MIDI number
  note: number
  start: number
  duration: number
  portamento?: boolean
}

export function namedKeyToMidi(key: KeyInfo) {
  // C4 = 60
  const octaveOffset = (key.octave - 4) * 12
  const keyOffset = keys.indexOf(key.name)
  return octaveOffset + keyOffset + 60
}

export function midiToNamedKey(midi: number): KeyInfo {
  const octave = Math.floor((midi - 60) / 12) + 4
  const key = midi - (octave - 4) * 12 - 60
  return {
    name: keys[key],
    octave,
  }
}

export const instruments = [
  { id: INSTRUMENT_PWM_LEAD, name: "PWM Lead" },
  { id: INSTRUMENT_REESE, name: "Reese" },
  { id: INSTRUMENT_PWM_LEAD_ARP, name: "PWM Lead ARP" },
  { id: INSTRUMENT_DRUMS, name: "Drums" },
  { id: INSTRUMENT_PAD, name: "Pad" },
]

export const getDawPaddedPatternLength = (notes: DawNote[]) => {
  if (notes.length === 0) {
    return DEFAULT_PATTERN_LENGTH
  }

  const lastNote = notes[notes.length - 1]
  const lastNoteEnd = lastNote.start + (lastNote.duration - 0.0001)

  return roundUpToMultipleOf(lastNoteEnd, ROUND_UP_TO)
}
