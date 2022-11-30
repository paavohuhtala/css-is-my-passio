
import { BEAT } from "../../src/globals"
import { createMixer } from "../../src/music/mixer"
import { musicPlayer } from "./player-slim"
import { INSTRUMENT_DRUMS, NOTE_ON } from "../../src/music/instrument"
import { KICK, SNARE } from "../../src/music/drum/drum_machine"
import { drumsPattern, introPattern, introPad, bassPattern, pwmPattern } from "./loops"
import styles from 'bundle-text:./styles.scss'

const body = document.querySelector("body")!
const styleTag = document.createElement("style")
styleTag.innerText = styles
document.head.appendChild(styleTag)

const scroller = (window as any)["s"] as HTMLDivElement
const rippleContainer = (window as any)["rc"] as HTMLDivElement
const dancefloorContainer = (window as any)["dc"] as HTMLDivElement
let danceFloorTiles: HTMLElement[] = []
const eyesContainer = (window as any)["e"] as HTMLDivElement
let eyes: HTMLElement[] = []
const flasher = (window as any)["fl"] as HTMLDivElement
const eyesBg = (window as any)["eb"] as HTMLDivElement
const bgScroller = (window as any)["bs"] as HTMLDivElement
const dancefloorLights = (window as any)["dl"] as HTMLDivElement
const fader = (window as any)["f"] as HTMLDivElement
const logo = (window as any)["l"] as HTMLDivElement

const audioCtx = new AudioContext()
const mixer = createMixer(audioCtx)

function generateNoisePng() {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 256

  const ctx = canvas.getContext("2d")!
  const imageData = ctx.createImageData(256, 256)

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = Math.random() * 255
    imageData.data[i + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)

  const dataUrl = canvas.toDataURL("image/png")
  body.style.setProperty("--noise", `url(${dataUrl})`)
}

function addSpan(target: HTMLElement, msg: string, deleteDelay?: number) {
  const span = document.createElement("span")
  span.innerText = msg
  target.appendChild(span)

  if (deleteDelay) {
    setTimeout(() => span.remove(), deleteDelay * BEAT)
  }
}

const addScrollerMessage = addSpan.bind(null, scroller)
const addBgScrollerMessage = addSpan.bind(null, bgScroller)

function createRipples(count = 12) {
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div")
    div.className = "ripple"
    div.style.animationDelay = `${(i * BEAT * 2)}ms`
    rippleContainer.appendChild(div)
  }
}

function createDancefloor() {
  for (let i = 0; i < 2; i++) {
    const layer = document.createElement("div")
    dancefloorContainer.appendChild(layer)

    for (let i = 0; i < 100; i++) {
      const div = document.createElement("div")
      danceFloorTiles.push(div)
      div.className = "dancefloor-tile"
  
      if (i % 3 === 0 || i % 5 === 0) {
        div.classList.add("react-to-kick")
      }
  
      div.style.animationDelay = `${(i * (BEAT / 4))}ms`
      layer.appendChild(div)
    }
  }
  randomizeTileColors()
}

function randomizeTileColors() {
  danceFloorTiles.forEach(tile => {
    tile.style.backgroundColor = `hsl(${Math.floor(Math.random() * 360)},100%,50%)`
  })
}

function flash(dark?: boolean, long?: boolean) {
  const c = dark ? "black-flash" : "white-flash"
  const l = long ? "long-flash" : "quick-flash"
  flasher.classList.add(c, l)
  setTimeout(() => flasher.classList.remove(c, l), BEAT * 8)
}

function addEyes() {
  const eyeCenter = document.createElement("div")
  eyeCenter.className = "eye-center"

  const mainEye = document.createElement("div")
  mainEye.className = "eye main-eye"
  const pupil = document.createElement("div")
  pupil.className = "pupil"
  mainEye.appendChild(pupil)

  eyeCenter.appendChild(mainEye)
  eyesContainer.appendChild(eyeCenter)

  const RAD_PER_EYE = (Math.PI * 2) / 12

  let animationDelay = 0

  eyes.push(mainEye)

  for (let i = 0; i < 12; i++) {
    const eye = document.createElement("div")
    eye.className = "eye"
    eye.style.animationDelay = `${animationDelay}ms`

    eyes.push(eye)

    const x = Math.cos(RAD_PER_EYE * i) * 50
    const y = Math.sin(RAD_PER_EYE * i) * 50
    eye.style.left = `calc(50% - 10% + ${x}%)`
    eye.style.top = `calc(50% - 10% + ${y}%)`

    const pupil = document.createElement("div")
    pupil.className = "pupil"
    pupil.style.animationDelay = `${animationDelay}ms`
    animationDelay += BEAT
    eye.appendChild(pupil)
    eyeCenter.appendChild(eye)
  }
}

generateNoisePng()
createRipples()
createDancefloor()

let prompt = document.createElement("p")
prompt.innerText = "Press ENTER to start!"
prompt.style.color = "white"
body.appendChild(prompt)

let isPlaying = false

function play() {
  if (isPlaying) {
    return
  }
  
  isPlaying = true

  prompt.remove()

  const player = musicPlayer(mixer)
  player.setPattern(0, drumsPattern)
  player.setPattern(1, introPattern)
  player.setPattern(2, introPad)
  player.setPattern(3, bassPattern)
  player.setPattern(4, pwmPattern)
  
  player.start()

  let currentBeat = 0

  function render() {
    const now = audioCtx.currentTime

    while (player.eventQueue.length > 0 && player.eventQueue[0].time < now) {
      const event = player.eventQueue.shift()!

      switch (event.type) {
        case 'beat': {
          const { beat } = event
          currentBeat = beat

          if (beat === 0) {
            flash(true, true)
            eyesBg.classList.remove("h")
          }

          if (beat === 4) {
            addScrollerMessage("Future Acronyms (FA)")
            addScrollerMessage("presents")
          }

          if (beat == 8) {
            logo.classList.add("active")
          }

          if (beat === 16) {
            flash()
            addEyes()
            addScrollerMessage("Presented at")
            addScrollerMessage("Reaktor Compo Extravaganza")
            addScrollerMessage("vol. 2")
            logo.remove()
          }

          if (beat === 28) {
            eyesBg.classList.add("faster")
          }

          if (beat === 32) {
            flash(false, true)
            eyesContainer.classList.add("show-pupil")
            eyesBg.classList.add("lighten")
          }

          if (beat === 40) {
            flash()
            eyesContainer.classList.add("animate-pupil")
          }

          if (beat === 48) {
            flash(false, true)
            body.classList.add("move-eye")

          }

          if (beat === 64) {
            flash(false)
            body.classList.add("rotate-eye")
            eyesBg.classList.add("vertical")
            dancefloorLights.classList.remove("h")
          }

          if (beat === 78) {
            bgScroller.classList.remove("h")
            eyesBg.classList.add("perspective-exit")
            dancefloorContainer.classList.remove("h")
          }

          if (beat === 86) {
            eyesBg.remove()
            eyesContainer.remove()
            eyes = []

            dancefloorContainer.classList.add("active")
          }

          if (beat === 90) {
            dancefloorContainer.classList.add("dancing")
            addBgScrollerMessage("CODE", 12)
            addBgScrollerMessage("GitHub Copilot", 12)
          }

          if (beat === 98) {
            addBgScrollerMessage("CODE, MUSIC", 12)
            addBgScrollerMessage("Paavo", 12)
          }

          if (beat === 106) {
            addBgScrollerMessage("Powered by <div> technology", 12)
          }

          if (beat === 114) {
            fader.classList.remove("h")
            fader.classList.add("fade-out")
          }

          if (beat === 120) {
            danceFloorTiles = []
            fader.remove()
            dancefloorContainer.remove()
            dancefloorLights.remove()
            bgScroller.remove()
            rippleContainer.classList.remove("h")
            rippleContainer.classList.add("active")
          }

          if (beat === 160) {
            rippleContainer.classList.add("scale-down")
          }

          if (beat === 164) {
            addScrollerMessage(""+{})
            player.stop()
          }

          break;
        }

        case 'instrument':
          if (event.instrumentid === INSTRUMENT_DRUMS) {
            if (event.event[0] === NOTE_ON) {
              switch (event.event[1]) {
                case KICK: {
                  body.classList.add("kick")
                  setTimeout(() => body.classList.remove("kick"), 100)

                  if (currentBeat >= 80 && eyes.length > 0) {
                    eyes[eyes.length - 1].classList.add("disappear")
                    eyes.pop()
                  }

                  if (currentBeat >= 84) {
                    randomizeTileColors()
                  }

                  break;
                }
                case SNARE: {
                  body.classList.add("snare")
                  setTimeout(() => body.classList.remove("snare"), 100)
                }
              }
            }
          }
      }
    }

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

document.addEventListener('keydown', (ev) => {
  if (ev.key === "Enter") {
    play()
    audioCtx.resume()
  }

  if (ev.key === ' ') {
    audioCtx.resume()
  }
})

