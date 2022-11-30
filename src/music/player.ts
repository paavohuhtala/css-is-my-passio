import { BEAT_S, BPM, BEAT_NOTE_DIVIDER, NOTE_S } from "../globals"
import { Mixer } from "./mixer"
import { Pattern } from "./sequencer"
import { createLead } from "./synth/lead"
import { InstrumentEvent, NOTE_OFF, SongContext } from "./instrument"
import { getPaddedPatternLength } from "./utils"
import { createBass } from "./synth/reese"
import { createArp } from "./synth/arp"
import { createDrumMachine } from "./drum/drum_machine"
import { createPad } from "./synth/pad"

interface MusicPlayerConfig {
  useEventQueue?: boolean
}

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

export interface PatternAdvanceEvent extends BaseEvent {
  type: "patternAdvance"
  patternTime: number
  patternId: number
}

export type PlayerEvent = BeatEvent | NoteEvent | PatternAdvanceEvent

export type PlayerEventType = PlayerEvent["type"]

interface PatternPlaybackState {
  pattern: Pattern
  offset: number
  length: number
}

type EventListeners = {
  [E in PlayerEvent as E["type"]]: ((event: E) => void)[]
}

export function musicPlayer(mixer: Mixer, { useEventQueue }: MusicPlayerConfig) {
  const { audioCtx } = mixer

  const eventListeners: EventListeners = {
    beat: [],
    patternAdvance: [],
    instrument: [],
  }
  const eventQueue: PlayerEvent[] = []

  const sendEvent = (event: PlayerEvent) => {
    setTimeout(() => {
      eventListeners[event.type].forEach((listener) => listener(event as any))
    }, (event.time - audioCtx.currentTime) * 1000)
    useEventQueue && eventQueue.push(event)
  }

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

  const MINOR_ARP = [0, 3, 7]

  const instruments = [
    createLead(audioCtx, mixer.pwmLead),
    createBass(audioCtx, mixer.bass),
    createArp(createLead(audioCtx, mixer.arp), { noteOffsets: MINOR_ARP, noteLength: NOTE_S * 2 }),
    createDrumMachine(audioCtx, mixer),
    createPad(audioCtx, mixer.pad),
  ]

  let patterns = new Map<number, PatternPlaybackState>()

  const ctx: SongContext = {
    bpm: BPM,
  }

  const sharedState = {
    soloPatternId: undefined as number | undefined,
    ctx,
  }

  function scheduler() {
    while (isPlaying && nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
      const advanceBeat = currentNote % BEAT_NOTE_DIVIDER === 0

      if (advanceBeat) {
        const beat = Math.floor(currentNote / BEAT_NOTE_DIVIDER)
        sendEvent({ type: "beat", beat, time: nextNoteTime })
      }

      for (let [patternId, patternState] of patterns.entries()) {
        const { pattern, length: patternLength } = patternState
        const patternWrappedCurrentNote = currentNote % patternLength

        // If the pattern is empty or solo is engaged and this is the wrong pattern, do nothing
        if (pattern.events.length === 0 || (sharedState.soloPatternId !== undefined && patternId !== sharedState.soloPatternId)) {
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

          instruments[pattern.instrumentId].scheduleEvent([adjustedTime, eventAtTime[1]], ctx)
          sendEvent({
            type: "instrument",
            event: eventAtTime[1],
            instrumentid: pattern.instrumentId,
            time: adjustedTime,
          })
          patternState.offset += 1
        }

        sendEvent({ type: "patternAdvance", patternTime: patternWrappedCurrentNote, patternId, time: nextNoteTime })
      }

      // Instrument updates for e.g arpeggios are handled 4x per NOTE_INCREMENT
      const updateMultiplier = 8
      const updateIncrement = NOTE_INCREMENT / updateMultiplier

      for (let i = 0; i < updateMultiplier; i++) {
        const time = nextNoteTime + updateIncrement * i

        for (const instrument of instruments) {
          instrument.onUpdate && instrument.onUpdate(time, ctx)
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

  const pause = async () => {
    if (!isPlaying) {
      return
    }

    isPlaying = false
    await audioCtx.suspend()
    if (timerId) {
      clearTimeout(timerId)
    }
  }

  const stop = async () => {
    if (!isPlaying) {
      return
    }

    await pause()
    instruments.forEach((instrument) => instrument.onStop(audioCtx.currentTime))

    patterns.forEach((pattern, patternId) => {
      pattern.offset = 0

      sendEvent({ type: "patternAdvance", patternTime: 0, patternId, time: audioCtx.currentTime })
    })

    currentNote = 0
    nextNoteTime = 0.0
  }

  const setPattern = (id: number, pattern: Pattern) => {
    const lastEvent = pattern.events.length > 0 ? pattern.events[pattern.events.length - 1] : undefined
    const lastEventTime = lastEvent ? lastEvent[0] : undefined
    const length = getPaddedPatternLength(lastEventTime)
    const currentPattern = patterns.get(id)

    if (currentPattern) {
      currentPattern.length = length
      currentPattern.pattern = pattern
      currentPattern.offset = currentPattern.offset % length
    } else {
      patterns.set(id, {
        pattern,
        length,
        offset: currentNote % length,
      })
    }
  }

  const setPatternInstrument = (id: number, instrumentId: number) => {
    const pattern = patterns.get(id)
    if (pattern) {
      pattern.pattern.instrumentId = instrumentId
    }
  }

  function on(eventType: "beat", cb: (event: BeatEvent) => void): () => void
  function on(eventType: "instrument", cb: (event: InstrumentEvent) => void): () => void
  function on(eventType: "patternAdvance", cb: (event: PatternAdvanceEvent) => void): () => void
  function on(eventType: PlayerEventType, cb: (event: any) => void): () => void {
    eventListeners[eventType].push(cb)

    return () => {
      eventListeners[eventType] = (eventListeners[eventType] as any).filter((f: any) => f !== cb)
    }
  }

  const toggle = async () => {
    if (isPlaying) {
      await pause()
    } else {
      await start()
    }
  }

  return {
    start,
    pause,
    stop,
    toggle,
    setPattern,
    setPatternInstrument,
    on,
    eventQueue,
    sharedState,
  }
}

export type MusicPlayer = ReturnType<typeof musicPlayer>
