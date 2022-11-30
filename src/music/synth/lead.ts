import { BEAT_S, NOTE_S } from "../../globals";
import { Instrument, midiToFreq, NOTE_OFF, NOTE_ON, SET_PORTAMENTO } from "../instrument";

export function createLead(
  audioCtx: AudioContext,
  destination: AudioNode
): Instrument {
  const gain = new GainNode(audioCtx, {
    gain: 0
  })

  const outGain = new GainNode(audioCtx, {
    gain: 0.5
  })

  const mainOsc = new OscillatorNode(audioCtx, {
    type: "sawtooth"
  })

  const pulseCurve = new Array(256);
  for (let i = 0; i < 128; i++) {
    pulseCurve[i] = -1;
    pulseCurve[i + 128] = 1;
  }

  const shaper = new WaveShaperNode(audioCtx, {
    oversample: "4x",
    curve: pulseCurve
  })

  const widthGain = new GainNode(audioCtx, {
    gain: 0
  })

  const constantOneShaper = new WaveShaperNode(audioCtx, {
    curve: [1, 1]
  })
  
  const widthMod = new OscillatorNode(audioCtx, {
    type: "triangle",
    frequency: 0.2
  })

  const widthModGain = new GainNode(audioCtx, {
    gain: 0.8
  })
  widthMod.connect(widthModGain)
  widthModGain.connect(widthGain.gain)

  mainOsc.connect(constantOneShaper)
  constantOneShaper.connect(widthGain)

  mainOsc.connect(shaper)
  widthGain.connect(shaper)

  shaper.connect(gain)
  gain.connect(outGain)
  outGain.connect(destination)

  mainOsc.start()
  widthMod.start()

  return {
    scheduleEvent([now, event]) {
      switch (event[0]) {
        case NOTE_ON:
          gain.gain.cancelAndHoldAtTime(now)
          mainOsc.frequency.setValueAtTime(midiToFreq(event[1]), now)
          gain.gain.setTargetAtTime(1.0, now, 0.05)
          break
        case NOTE_OFF:
          gain.gain.cancelAndHoldAtTime(now)
          gain.gain.setTargetAtTime(0.0, now, 0.05)
          break
        case SET_PORTAMENTO:
          const [_, pitch, time] = event
          mainOsc.frequency.cancelAndHoldAtTime(now)
          mainOsc.frequency.setTargetAtTime(midiToFreq(pitch), now, time * NOTE_S)
          break
      }
    },
    onStop(now) {
      gain.gain.cancelAndHoldAtTime(now)
      gain.gain.setValueAtTime(0, now)
    },
  }
}
