
export interface Mixer {
  audioCtx: AudioContext

  kick: GainNode
  hihat: GainNode
  ride: GainNode
  snare: GainNode
  piccoloSnare: GainNode

  drumBus: GainNode

  bass: GainNode
  pwmLead: GainNode
  arp: GainNode
  pad: GainNode
}

export function createMixer(audioCtx: AudioContext): Mixer {
  const mixer: Mixer = {
    audioCtx,

    kick: audioCtx.createGain(),
    hihat: audioCtx.createGain(),
    ride: audioCtx.createGain(),
    snare: audioCtx.createGain(),
    piccoloSnare: audioCtx.createGain(),

    drumBus: audioCtx.createGain(),

    bass: audioCtx.createGain(),
    pwmLead: audioCtx.createGain(),
    arp: audioCtx.createGain(),
    pad: audioCtx.createGain(),
  }
  
  mixer.kick.connect(mixer.drumBus)
  mixer.hihat.connect(mixer.drumBus)
  mixer.ride.connect(mixer.drumBus)
  mixer.snare.connect(mixer.drumBus)
  mixer.piccoloSnare.connect(mixer.drumBus)
  mixer.drumBus.connect(audioCtx.destination)

  mixer.bass.connect(audioCtx.destination)
  mixer.pwmLead.connect(audioCtx.destination)
  mixer.arp.connect(audioCtx.destination)
  mixer.pad.connect(audioCtx.destination)
  
  mixer.kick.gain.value = 0.8
  mixer.hihat.gain.value = 0.4
  mixer.ride.gain.value = 0.2
  mixer.snare.gain.value = 0.8
  mixer.piccoloSnare.gain.value = 0.4
  mixer.drumBus.gain.value = 0.8

  mixer.bass.gain.value = 0.5
  mixer.pwmLead.gain.value = 0.3
  mixer.arp.gain.value = 0.4
  mixer.pad.gain.value = 0.3

  return mixer
}
