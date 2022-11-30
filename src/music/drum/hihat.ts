import { DrumInstrument } from "../instrument"

interface HihatConfig {
  decay: number
  fundamental: number
}

export function createHihat(
  audioCtx: AudioContext,
  destination: AudioNode,
  { decay, fundamental }: HihatConfig
): DrumInstrument {
  const ratios = [2, 3, 4.16, 5.43, 6.79, 8.21]

  const gain = new GainNode(audioCtx, {
    gain: 0
  })
  const bandPass = new BiquadFilterNode(audioCtx, {
    type: "bandpass",
    frequency: 8_000
  })

  const highpass = new BiquadFilterNode(audioCtx, {
    type: "highpass",
    frequency: 10_000
  })

  bandPass.connect(highpass)
  highpass.connect(gain)
  gain.connect(destination)

  ratios.forEach(ratio => {
    const oscillator = new OscillatorNode(audioCtx, {
      type: "square",
      frequency: fundamental * ratio
    })

    oscillator.connect(bandPass)
    oscillator.start()
  })

  return {
    schedulePlay(now: number) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueCurveAtTime(
        [0.0, 1.0, 0.8, 0.4, 0.1, 0.0],
        now,
        decay,
      )
    },
    onStop(now: number) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(0, now)
    }
  }
}