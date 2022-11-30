import { InstrumentEventAtTime, InstrumentId, INSTRUMENT_DRUMS, NOTE_OFF, NOTE_ON, SET_PORTAMENTO } from "../../src/music/instrument"
import { Pattern } from "../../src/music/sequencer"
import { DawNote } from "./types"
import { windows } from "./utils"

export function notesToPattern(notes: DawNote[], instrumentId: InstrumentId): Pattern {
  if (notes.length === 0) {
    return {
      events: [],
      instrumentId,
    }
  }

  const events: InstrumentEventAtTime[] = []

  for (const noteWindow of windows(notes, 2)) {
    const [note] = noteWindow
    const nextNote = noteWindow[1] as DawNote | undefined

    const startTime = note.start
    const endTime = startTime + note.duration

    if (note.portamento) {
      events.push([startTime, [SET_PORTAMENTO, note.note, note.duration]])
    } else {
      const skipOff = nextNote && !nextNote.portamento && endTime === nextNote.start
      events.push([startTime, [NOTE_ON, note.note]])

      // Do not emit NOTE_OFF events for drum patterns
      if (instrumentId !== INSTRUMENT_DRUMS) {
        // Emit end times -1 before - player handles this
        events.push([endTime - 1, [NOTE_OFF]])
      }
    }
  }

  events.sort((a, b) => a[0] - b[0])

  return {
    events: events,
    instrumentId,
  }
}

// Delta compress
export function delta(sequence: Pattern): Pattern {
  let lastTime = 0

  return {
    ...sequence,
    events: sequence.events.map(([time, event]) => {
      const delta = time - lastTime
      lastTime = time
      return [delta, event]
    })
  }
}
