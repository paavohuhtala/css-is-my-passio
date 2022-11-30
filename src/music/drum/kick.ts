import { DrumInstrument } from "../instrument"

interface KickConfig {
  pitch: number
  duration: number
  pitchDuration: number
}

export const clubKick: KickConfig = {
  pitch: 80,
  duration: 0.18,
  pitchDuration: 0.1,
}

export const tightKick: KickConfig = {
  pitch: 80,
  duration: 0.12,
  pitchDuration: 0.08,
}

export function createKick(
  audioCtx: AudioContext,
  destination: AudioNode,
  config: KickConfig,
): DrumInstrument {
  const { pitch, duration, pitchDuration } = config

  const oscillator = new OscillatorNode(audioCtx, {
    type: "sine",
  })

  const gain = new GainNode(audioCtx, {
    gain: 0
  })

  oscillator.connect(gain)
  gain.connect(destination)

  oscillator.start()

  return {
    schedulePlay(now: number) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueCurveAtTime([0.0, 1.0, 0.8, 0.5, 0.3, 0.0], now, duration)

      oscillator.frequency.cancelScheduledValues(now)
      oscillator.frequency.setValueCurveAtTime([pitch * 4, pitch * 1.1, pitch], now, pitchDuration)
    },
    onStop(now: number) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(0, now)
      oscillator.frequency.cancelScheduledValues(now)
    },
  }
}