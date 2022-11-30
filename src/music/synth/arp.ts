import { Instrument, NOTE_OFF, NOTE_ON, SET_PORTAMENTO } from "../instrument"

interface ArpParams {
  noteOffsets: number[]
  noteLength: number
}

export function createArp(
  inner: Instrument,
  { noteOffsets, noteLength }: ArpParams
): Instrument {
  let startTime: number | undefined = undefined
  let endTime: number | undefined = undefined

  let rootNote = 0

  return {
    scheduleEvent([now, event], ctx) {
      switch (event[0]) {
        case NOTE_ON:
          startTime = now
          rootNote = event[1]
          break
        case NOTE_OFF:
          endTime = now
          inner.scheduleEvent([now, [NOTE_OFF]], ctx)
          break
        case SET_PORTAMENTO:
          rootNote = event[1]
          break
      }
    },
    onUpdate(now, ctx) {
      if (startTime === undefined) {
        return
      }

      if (endTime && endTime >= startTime) {
        startTime = undefined
        endTime = undefined
        return
      }

      const noteIndex = Math.floor(Math.max(0, now - startTime) / noteLength)
      const noteOffset = noteOffsets[noteIndex % noteOffsets.length]

      inner.scheduleEvent([now, [NOTE_ON, rootNote + noteOffset]], ctx)
      inner.scheduleEvent([now + noteLength, [NOTE_OFF]], ctx)
    },
    onStop(now) {
      startTime = undefined
      inner.onStop(now)
    }
  }
}