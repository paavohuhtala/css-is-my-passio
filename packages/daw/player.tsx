import React from "react"
import { createMixer } from "../../src/music/mixer"
import { MusicPlayer, musicPlayer } from "../../src/music/player"

const audioCtx = new AudioContext()
const mixer = createMixer(audioCtx)

export function createPlayer() {
  const player = musicPlayer(mixer, {
    useEventQueue: false
  })
  
  return player
}

export const MusicPlayerContext = React.createContext<MusicPlayer | undefined>(undefined)
