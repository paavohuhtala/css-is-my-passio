import { Instrument, midiToFreq, NOTE_OFF, NOTE_ON, SET_PORTAMENTO } from "../instrument";

export function createBass(audioCtx: AudioContext, destination: AudioNode): Instrument {
  const ATTACK_TO_SUSTAIN = 0.1
  const SUSTAIN_TO_RELEASE = 0.2
  const GLIDE_TIME = 0.2

  const gain = new GainNode(audioCtx, {
    gain: 0
  })

  const lowPass = new BiquadFilterNode(audioCtx, {
    type: "lowpass",
    frequency: 1_000,
    Q: 1.5
  })

  const lfo1 = new OscillatorNode(audioCtx, {
    type: "sine",
    frequency: 0.3
  })

  const lfo1Gain = new GainNode(audioCtx, {
    gain: 200.0
  })

  lfo1.start()
  lfo1.connect(lfo1Gain)
  lfo1Gain.connect(lowPass.frequency)

  const reese1 = new OscillatorNode(audioCtx, {
    type: "sawtooth",
    detune: -16
  })

  const reese2 = new OscillatorNode(audioCtx, {
    type: "sawtooth",
    detune: 16
  })

  const sub = new OscillatorNode(audioCtx, {
    type: "sine",
  })

  const waveShaper = new WaveShaperNode(audioCtx, {
    oversample: "4x",
    curve: [0, 0.5, 1, 0.5, 0]
  })

  reese1.start()
  reese2.start()
  sub.start()

  reese1.connect(lowPass)
  reese2.connect(lowPass)
  lowPass.connect(waveShaper)
  waveShaper.connect(gain)

  sub.connect(gain)

  gain.connect(destination)

  let previousTime: number | undefined = undefined

  return {
    scheduleEvent: (event) => {
      const [time, data] = event

      if (previousTime !== undefined) {
        reese1.frequency.cancelScheduledValues(previousTime)
        reese2.frequency.cancelScheduledValues(previousTime)
        sub.frequency.cancelScheduledValues(previousTime)
        gain.gain.cancelScheduledValues(previousTime)
      }

      switch (data[0]) {
        case NOTE_ON: {
          const freq = midiToFreq(data[1])
          reese1.frequency.setTargetAtTime(freq, time, 0.05)
          reese2.frequency.setTargetAtTime(freq, time, 0.05)
          sub.frequency.setTargetAtTime(freq / 2, time, 0.05)
          gain.gain.setValueCurveAtTime([0.0, 1.0, 0.8], time, ATTACK_TO_SUSTAIN)
          break
        }
        case NOTE_OFF: {
          gain.gain.setValueCurveAtTime([0.8, 0.0], time, SUSTAIN_TO_RELEASE)
          break
        }
        case SET_PORTAMENTO: {
          const freq = midiToFreq(data[1])
          reese1.frequency.setValueCurveAtTime([reese1.frequency.value, freq], time, GLIDE_TIME)
          reese2.frequency.setValueCurveAtTime([reese2.frequency.value, freq], time, GLIDE_TIME)
          sub.frequency.setValueAtTime(freq / 2, time)
        }
      }

      previousTime = time
    },
    onStop(now) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(0, now)
    },
  }
}