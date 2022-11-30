import { DrumInstrument, Instrument, NOTE_ON } from "../instrument";
import { Mixer } from "../mixer";
import { createHihat } from "./hihat";
import { clubKick, createKick, tightKick } from "./kick";
import { createNoiseBuffer } from "./noise";
import { createSnare } from "./snare";

const ROOT_NOTE = 60; // C4

export const KICK = ROOT_NOTE + 0
export const SNARE = ROOT_NOTE + 1
export const PICCOLO = ROOT_NOTE + 2
export const HIHAT = ROOT_NOTE + 3
export const HIHAT_LONG = ROOT_NOTE + 4
export const KICK_TIGHT = ROOT_NOTE + 5

export function createDrumMachine(
  audioCtx: AudioContext,
  mixer: Mixer,
): Instrument {
  const noise = createNoiseBuffer(audioCtx)

  const kick = createKick(audioCtx, mixer.kick, clubKick)

  const hihat = createHihat(audioCtx, mixer.hihat, {
    decay: 0.1,
    fundamental: 40,
  })

  const hihatLong = createHihat(audioCtx, mixer.ride, {
    decay: 0.3,
    fundamental: 100,
  })

  const snare = createSnare(audioCtx, mixer.snare, noise, {
    hit: {
      length: 0.1,
      freq: 220,
      freqMod: 1.8,
      freqDecay: 0.3,
    },
    tail: {
      length: 0.2,
      highpassFreq: 5_000,
    },
    fundamentalBandPassFreq: 400,
  })

  const piccoloSnare = createSnare(audioCtx, mixer.piccoloSnare, noise, {
    hit: {
      length: 0.08,
      freq: 230,
      freqMod: 2.2,
      freqDecay: 0.1,
    },
    tail: {
      length: 0.12,
      highpassFreq: 5_000,
    },
    fundamentalBandPassFreq: 900,
  })

  const kickTight = createKick(audioCtx, mixer.kick, tightKick)

  const drums: DrumInstrument[] = [kick, snare, piccoloSnare, hihat, hihatLong, kickTight]

  return {
    scheduleEvent([now, event], ctx) {
      switch (event[0]) {
        case NOTE_ON: {
          const drumIndex = event[1] - ROOT_NOTE
          const drum = drums[drumIndex]
          if (drum) {
            drum.schedulePlay(now)
          }
          break
        }
      }
    },
    onStop(now) {
      drums.forEach((drum) => drum.onStop(now))
    }
  }
}