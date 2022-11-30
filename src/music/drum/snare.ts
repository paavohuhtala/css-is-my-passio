import { DrumInstrument } from "../instrument"

export function createSnare(
  audioCtx: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  {
    hit,
    tail,
    fundamentalBandPassFreq,
  }: {
    hit: {
      freq: number,
      freqMod: number,
      length: number,
      freqDecay: number,
    },
    tail: {
      length: number,
      highpassFreq: number,
    },
    fundamentalBandPassFreq: number
  }
): DrumInstrument {
  const fundamentalGain = new GainNode(audioCtx, {
    gain: 0.9,
  })

  const fundamentalEnvelope = new GainNode(audioCtx, {
    gain: 0
  })

  const fundamentalBandPass = new BiquadFilterNode(audioCtx, {
    type: "bandpass",
    frequency: fundamentalBandPassFreq,
    Q: 1.2
  })

  const oscillator = new OscillatorNode(audioCtx, {
    type: "triangle",
    frequency: hit.freq,
  })
  

  oscillator.start()
  oscillator.connect(fundamentalEnvelope)
  fundamentalEnvelope.connect(fundamentalBandPass)
  fundamentalBandPass.connect(fundamentalGain)
  fundamentalGain.connect(destination)

  const noiseGain = new GainNode(audioCtx, {
    gain: 0.5,
  })

  const noise = new AudioBufferSourceNode(audioCtx, {
    buffer: noiseBuffer,
    loop: true
  })

  const noiseEnvelope = new GainNode(audioCtx, {
    gain: 0
  })

  const noiseHighPass = new BiquadFilterNode(audioCtx, {
    type: "highpass",
    frequency: tail.highpassFreq,
  })

  noise.start()
  noise.connect(noiseEnvelope)
  noiseEnvelope.connect(noiseHighPass)
  noiseHighPass.connect(noiseGain)
  noiseGain.connect(destination)

  return {
    schedulePlay(now) {
        fundamentalEnvelope.gain.cancelScheduledValues(now)
        fundamentalEnvelope.gain.setValueCurveAtTime([1.0, 1.0, 0.4, 0.1, 0.0], now, hit.length)
    
        noiseEnvelope.gain.cancelScheduledValues(now)
        noiseEnvelope.gain.setValueCurveAtTime([0.0, 1.0, 0.8, 0.4, 0.2, 0.0], now, tail.length)
    
        oscillator.frequency.cancelScheduledValues(now)
        oscillator.frequency.setValueCurveAtTime([hit.freq * hit.freqMod, hit.freq], now, hit.freqDecay)
    },
    onStop(now) {
      fundamentalEnvelope.gain.cancelScheduledValues(now)
      noiseEnvelope.gain.cancelScheduledValues(now)
      oscillator.frequency.cancelScheduledValues(now)

      noiseEnvelope.gain.setValueAtTime(0, now)
      fundamentalEnvelope.gain.setValueAtTime(0, now)
    }
  }
}