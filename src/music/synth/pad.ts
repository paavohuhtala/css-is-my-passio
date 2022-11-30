import { NOTE_S } from "../../globals";
import { Instrument, midiToFreq, NOTE_OFF, NOTE_ON, SET_PORTAMENTO } from "../instrument";

export function createPad(
  audioContext: AudioContext,
  destination: AudioNode,
): Instrument {
  const gain = new GainNode(audioContext, {
    gain: 0
  })

  const voices = 5
  const centerVoice = 2
  const spread = 0.5
  const pans = [spread, spread / 2, 0, -spread/2, spread]

  const filter = new BiquadFilterNode(audioContext, {
    type: "lowpass",
    frequency: 3_000
  })

  const oscillators: OscillatorNode[] = []

  for (let i = 0; i < voices; i++) {
    const oscillator = new OscillatorNode(audioContext, {
      type: "sine",
      detune: (i - centerVoice) * 5
    })

    const oscillatorGain = new GainNode(audioContext, {
      gain: 1 / voices
    })

    const oscillatorPan = new StereoPannerNode(audioContext, {
      pan: pans[i]
    })

    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(oscillatorPan)
    oscillatorPan.connect(filter)
    oscillator.start()

    oscillators.push(oscillator)
  }

  filter.connect(gain)
  gain.connect(destination)

  return {
    scheduleEvent([now, event]) {
      switch (event[0]) {
        case NOTE_ON: {
          gain.gain.cancelScheduledValues(now)
          gain.gain.setValueCurveAtTime([0.0, 0.4, 1.0], now, 0.5)
          filter.frequency.cancelScheduledValues(now)
          filter.frequency.setValueCurveAtTime([1_000, 3_000, 7_000, 4_000], now, 2.0)

          const note = event[1]
          oscillators.forEach(oscillator => {
            oscillator.frequency.setValueAtTime(midiToFreq(note), now)
          })
          break;
        }
        // intentional fallthrough
        case SET_PORTAMENTO: {
          const [_, note, time] = event
          oscillators.forEach(oscillator => {
            oscillator.frequency.setTargetAtTime(midiToFreq(note), now, time * NOTE_S)
          })
          break
        }
        case NOTE_OFF: {
          gain.gain.cancelScheduledValues(now)
          gain.gain.setValueCurveAtTime([1.0, 0.0], now, 0.2)
        }
      }
    },
    onStop(now: number) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(0, now)
    }
  }
}