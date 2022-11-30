
export function createNoiseBuffer(audioCtx: AudioContext) {
  // Generate noise buffer for the tail of the snare
  // https://noisehack.com/generate-noise-web-audio-api/

  const bufferSize = 2 * audioCtx.sampleRate
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const output = noiseBuffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }

  return noiseBuffer
}
