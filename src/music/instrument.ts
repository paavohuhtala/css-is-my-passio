export const NOTE_ON = 0
export const NOTE_OFF = 1
export const SET_PORTAMENTO = 2
export const NOP = 3

export const INSTRUMENT_PWM_LEAD = 0
export const INSTRUMENT_REESE = 1
export const INSTRUMENT_PWM_LEAD_ARP = 2
export const INSTRUMENT_DRUMS = 3
export const INSTRUMENT_PAD = 4

export const INSTRUMENT_IDS = [
  INSTRUMENT_PWM_LEAD,
  INSTRUMENT_REESE,
  INSTRUMENT_PWM_LEAD_ARP,
  INSTRUMENT_DRUMS,
  INSTRUMENT_PAD,
]

export type InstrumentId = typeof INSTRUMENT_IDS[number]

export type InstrumentEvent =
  | [typeof NOTE_ON, number] // note on
  | [typeof NOTE_OFF] // note off
  | [typeof SET_PORTAMENTO, number, number] // set pitch in x time
  | [typeof NOP] // no operation

export type InstrumentEventAtTime = [number, InstrumentEvent]

export interface SongContext {
  bpm: number
}

export interface Instrument {
  scheduleEvent: (event: InstrumentEventAtTime, ctx?: SongContext) => void
  onUpdate?: (now: number, ctx?: SongContext) => void
  onStop: (now: number) => void
}

const ROOT_A4 = 440

export function midiToFreq(note: number) {
  return ROOT_A4 * Math.pow(2, (note - 69) / 12);
}

export interface DrumInstrument {
  schedulePlay: (now: number) => void
  onStop: (now: number) => void
}
