import { BEAT_S, NOTE_S, BPM, BEAT_NOTE_DIVIDER } from "../../src/globals"
import { createDrumMachine } from "../../src/music/drum/drum_machine"
import { InstrumentEvent, SongContext, NOTE_OFF } from "../../src/music/instrument"
import { Mixer } from "../../src/music/mixer"
import { Pattern } from "../../src/music/sequencer"
import { createArp } from "../../src/music/synth/arp"
import { createLead } from "../../src/music/synth/lead"
import { createPad } from "../../src/music/synth/pad"
import { createBass } from "../../src/music/synth/reese"
import { getPaddedPatternLength } from "../../src/music/utils"

interface BaseEvent {
  time: number
}

export interface BeatEvent extends BaseEvent {
  type: "beat"
  beat: number
}

export interface NoteEvent extends BaseEvent {
  type: "instrument"
  event: InstrumentEvent
  instrumentid: number
}

export type PlayerEvent = BeatEvent | NoteEvent

export type PlayerEventType = PlayerEvent["type"]

interface PatternPlaybackState {
  pattern: Pattern
  offset: number
  length: number
}

export function musicPlayer(mixer: Mixer) {
  const { audioCtx } = mixer

  const eventQueue: PlayerEvent[] = []

  const NOTE_INCREMENT = BEAT_S / 4

  const SCHEDULE_AHEAD_TIME = 0.05
  const LOOKAHEAD = 15.0

  let isPlaying = false

  let currentNote = 0
  let nextNoteTime = 0.0

  function nextNote() {
    nextNoteTime += NOTE_INCREMENT
    currentNote += 1
  }

  let timerId: NodeJS.Timeout | undefined = undefined

  const instruments = [
    createLead(audioCtx, mixer.pwmLead),
    createBass(audioCtx, mixer.bass),
    createArp(createLead(audioCtx, mixer.arp), { noteOffsets: [0, 3, 7], noteLength: NOTE_S * 2 }),
    createDrumMachine(audioCtx, mixer),
    createPad(audioCtx, mixer.pad),
  ]

  let patterns = new Map<number, PatternPlaybackState>()

  function scheduler() {
    while (isPlaying && nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
      const advanceBeat = currentNote % BEAT_NOTE_DIVIDER === 0

      if (advanceBeat) {
        const beat = Math.floor(currentNote / BEAT_NOTE_DIVIDER)
        eventQueue.push({ type: "beat", beat, time: nextNoteTime })
      }

      for (let patternState of patterns.values()) {
        const { pattern, length } = patternState
        const patternWrappedCurrentNote = currentNote % length

        // If the pattern is empty or solo is engaged and this is the wrong pattern, do nothing
        if (pattern.events.length === 0) {
          continue
        }

        // Reset the pattern when we wrap around
        if (patternWrappedCurrentNote === 0 && !pattern.playOnce) {
          patternState.offset = 0
        }

        // Schedule upcoming events
        while (
          patternState.pattern.events[patternState.offset] &&
          patternState.pattern.events[patternState.offset][0] <= patternWrappedCurrentNote
        ) {
          const eventAtTime = pattern.events[patternState.offset]
          const timeOffset = eventAtTime[1][0] === NOTE_OFF ? (NOTE_INCREMENT - 0.00001) : 0
          const adjustedTime = nextNoteTime + timeOffset

          instruments[pattern.instrumentId].scheduleEvent([adjustedTime, eventAtTime[1]])
          eventQueue.push({
            type: "instrument",
            event: eventAtTime[1],
            instrumentid: pattern.instrumentId,
            time: adjustedTime,
          })
          patternState.offset += 1
        }
      }

      // Instrument updates for e.g arpeggios are handled 4x per NOTE_INCREMENT
      const updateMultiplier = 8
      const updateIncrement = NOTE_INCREMENT / updateMultiplier

      for (let i = 0; i < updateMultiplier; i++) {
        const time = nextNoteTime + updateIncrement * i

        for (const instrument of instruments) {
          instrument.onUpdate && instrument.onUpdate(time)
        }
      }

      nextNote()
    }

    timerId = setTimeout(scheduler, LOOKAHEAD)
  }

  const start = async () => {
    if (isPlaying) {
      return
    }

    await audioCtx.resume()
    isPlaying = true
    nextNoteTime = audioCtx.currentTime
    scheduler()
  }

  const stop = async () => {
    isPlaying = false
    await audioCtx.suspend()
    if (timerId) {
      clearTimeout(timerId)
    }

    instruments.forEach((instrument) => instrument.onStop(audioCtx.currentTime))
  }

  const setPattern = (id: number, pattern: Pattern) => {
    const lastEventTime = pattern.events[pattern.events.length - 1][0]
    const length = getPaddedPatternLength(lastEventTime)

    patterns.set(id, {
      pattern,
      length,
      offset: 0,
    })
  }

  return {
    start,
    stop,
    setPattern,
    eventQueue,
  }
}

export type MusicPlayer = ReturnType<typeof musicPlayer>
