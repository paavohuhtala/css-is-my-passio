import { INSTRUMENT_DRUMS, INSTRUMENT_PAD, INSTRUMENT_PWM_LEAD, INSTRUMENT_PWM_LEAD_ARP, INSTRUMENT_REESE } from "../../src/music/instrument"
import { combine, concatPatterns, Pattern, repeat, silence, undelta } from "../../src/music/sequencer"

const introBeat: Pattern = undelta({
  events: [
    [0, [0, 60]],
    [6, [0, 60]],
    [10, [0, 60]],
    [6, [0, 60]],
    [10, [0, 60]],
    [6, [0, 60]],
    [10, [0, 60]],
    [6, [0, 60]],
    [8, [0, 60]],
  ],
  instrumentId: 3,
})

const amen: Pattern = undelta({
  events: [
    [0, [0, 60]],
    [0, [0, 64]],
    [2, [0, 63]],
    [2, [0, 61]],
    [0, [0, 64]],
    [2, [0, 63]],
    [1, [0, 62]],
    [1, [0, 64]],
    [1, [0, 62]],
    [1, [0, 60]],
    [0, [0, 63]],
    [2, [0, 61]],
    [0, [0, 64]],
    [2, [0, 63]],
  ],
  instrumentId: 3,
})

const break2: Pattern = undelta({
  events: [
    [0, [0, 64]],
    [0, [0, 60]],
    [2, [0, 65]],
    [2, [0, 61]],
    [0, [0, 64]],
    [3, [0, 62]],
    [1, [0, 64]],
    [1, [0, 62]],
    [1, [0, 61]],
    [2, [0, 64]],
    [2, [0, 63]],
    [2, [0, 61]],
    [0, [0, 64]],
    [2, [0, 63]],
    [2, [0, 64]],
    [0, [0, 65]],
    [2, [0, 61]],
    [0, [0, 63]],
    [2, [0, 64]],
    [2, [0, 63]],
    [0, [0, 65]],
    [2, [0, 61]],
    [0, [0, 64]],
    [2, [0, 63]],
    [1, [0, 62]],
  ],
  instrumentId: 3,
})

const hihats: Pattern = undelta({
  events: [
    [2, [0, 63]],
    [8, [0, 64]],
    [4, [0, 63]],
    [1, [0, 63]],
  ],
  instrumentId: 3,
})
const kick4: Pattern = undelta({
  events: [
    [0, [0, 60]],
    [4, [0, 60]],
    [4, [0, 60]],
    [4, [0, 60]],
  ],
  instrumentId: 3,
})

export const mainArp: Pattern = undelta({
  events: [
    [0, [0, 60]],
    [10, [2, 65, 6]],
    [5, [1]],
    [1, [0, 60]],
    [8, [2, 65, 8]],
    [7, [1]],
    [1, [0, 60]],
    [10, [2, 65, 6]],
    [5, [1]],
    [1, [0, 60]],
    [8, [2, 65, 8]],
    [7, [1]],
  ],
  instrumentId: 2,
})

const mainBass: Pattern = undelta({
  events: [
    [2, [0, 36]],
    [29, [1]],
    [1, [0, 39]],
    [31, [1]],
    [3, [0, 43]],
    [29, [1]],
    [1, [0, 46]],
    [20, [2, 39, 11]],
    [9, [1]],
  ],
  instrumentId: 1,
})

const introPad1: Pattern = undelta({
  events: [
    [0, [0, 48]],
    [112, [2, 36, 12]],
    [11, [1]],
  ],
  instrumentId: 4,
})
const introPad2: Pattern = undelta({
  events: [
    [0, [0, 48]],
    [96, [2, 71, 32]],
    [31, [1]],
  ],
  instrumentId: 4,
})
const padDown: Pattern = undelta({
  events: [
    [0, [0, 60]],
    [2, [2, 36, 2]],
    [13, [1]],
  ],
  instrumentId: 4,
})

const pwmTechno: Pattern = undelta({
  events: [
    [0, [0, 51]],
    [1, [1]],
    [1, [0, 36]],
    [1, [1]],
    [1, [0, 48]],
    [0, [1]],
    [2, [0, 36]],
    [1, [1]],
    [1, [0, 48]],
    [0, [1]],
    [2, [0, 36]],
    [1, [1]],
    [0, [0, 48]],
    [0, [1]],
    [3, [0, 48]],
    [0, [1]],
    [1, [0, 36]],
    [0, [1]],
    [1, [0, 48]],
    [0, [1]],
    [2, [0, 36]],
    [1, [1]],
    [13, [0, 46]],
    [1, [1]],
    [1, [0, 36]],
    [1, [1]],
    [1, [0, 48]],
    [0, [1]],
    [2, [0, 36]],
    [1, [1]],
    [0, [0, 48]],
    [0, [1]],
    [3, [0, 48]],
    [0, [1]],
    [1, [0, 36]],
    [0, [1]],
    [1, [0, 48]],
    [0, [1]],
    [2, [0, 36]],
    [1, [1]],
    [1, [0, 51]],
    [1, [1]],
    [1, [0, 36]],
    [1, [1]],
  ],
  instrumentId: 0,
})

const reeseTechno: Pattern = undelta({
  events: [
    [22, [0, 48]],
    [9, [1]],
    [23, [0, 51]],
    [9, [1]],
  ],
  instrumentId: 1,
})

export const introPad = concatPatterns(INSTRUMENT_PAD, introPad1, introPad2, padDown)
introPad.playOnce = true

export const drumsPattern: Pattern = concatPatterns(
  INSTRUMENT_DRUMS,
  silence(4),
  repeat(3, introBeat),
  silence(16),
  repeat(8, amen),
  repeat(4, kick4),
  repeat(8, combine(hihats, kick4)),
  repeat(2, break2),
  silence(4),
  repeat(8, kick4),
  repeat(10, combine(hihats, kick4)),
  repeat(2, hihats),
)
drumsPattern.playOnce = true

export const bassPattern: Pattern = concatPatterns(INSTRUMENT_REESE, silence(24), repeat(2, mainBass), silence(4), repeat(2, reeseTechno))
bassPattern.playOnce = true

export const introPattern: Pattern = concatPatterns(INSTRUMENT_PWM_LEAD_ARP, silence(16), repeat(6, mainArp))
introPattern.playOnce = true

export const pwmPattern: Pattern = concatPatterns(INSTRUMENT_PWM_LEAD, silence(44), repeat(4, pwmTechno))
pwmPattern.playOnce = true
