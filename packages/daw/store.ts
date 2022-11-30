import {
  configureStore,
  createSlice,
  PayloadAction,
  createSelector,
  combineReducers,
  TypedStartListening,
  createListenerMiddleware,
  isAnyOf,
  createEntityAdapter,
} from "@reduxjs/toolkit"
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux"
import { InstrumentId, INSTRUMENT_PWM_LEAD } from "../../src/music/instrument"
import { MusicPlayer } from "../../src/music/player"
import { notesToPattern } from "./conversion"
import { DawNote, getDawPaddedPatternLength } from "./types"

const notesAdapter = createEntityAdapter<DawNote>({
  sortComparer: (a, b) => (a.start + a.duration) - (b.start + b.duration),
})

type PianoRollNotes = ReturnType<typeof notesAdapter.getInitialState>

export interface PianoRollPattern {
  id: number
  notes: PianoRollNotes
  name: string
  instrumentId: InstrumentId
}

export type PianoRollPatterns = PianoRollPattern[]

interface PianoRollState {
  patterns: PianoRollPatterns
  selectedPatternId: number
  portamento: boolean
}

const pianoRollInitialState: PianoRollState = {
  patterns: [
    {
      id: 0,
      notes: notesAdapter.getInitialState(),
      name: "Pattern 1",
      instrumentId: INSTRUMENT_PWM_LEAD,
    },
  ],
  selectedPatternId: 0,
  portamento: false,
}

export const {
  reducer: pianoRollReducer,
  actions: {
    upsertNote,
    removeNote,
    setNoteDuration,
    setNoteStart,
    setPatterns,
    setPortamento,
    addPattern,
    setSelectedPatternId,
    setPatternName,
    setPatternInstrument,
    clearPattern,
  },
} = createSlice({
  name: "pianoRoll",
  initialState: pianoRollInitialState,
  reducers: {
    upsertNote: (state, { payload }: PayloadAction<DawNote>) => {
      const pattern = state.patterns[state.selectedPatternId]

      if (!pattern) {
        return
      }

      notesAdapter.upsertOne(pattern.notes, {
        ...payload,
        id: payload.id ?? `${payload.start}-${payload.note}`,
        portamento: payload.portamento ?? state.portamento,
      })
    },

    removeNote: (state, { payload }: PayloadAction<DawNote>) => {
      const pattern = state.patterns[state.selectedPatternId]

      if (!pattern) {
        return
      }

      notesAdapter.removeOne(pattern.notes, payload.id)
    },

    setNoteDuration: (state, { payload }: PayloadAction<{ id: string, duration: number }>) => {
      const pattern = state.patterns[state.selectedPatternId]

      if (!pattern) {
        return
      }

      notesAdapter.updateOne(pattern.notes, {
        id: payload.id,
        changes: {
          duration: payload.duration,
        },
      })
    },

    setNoteStart: (state, { payload }: PayloadAction<{ id: string; start: number; duration: number }>) => {
      const pattern = state.patterns[state.selectedPatternId]

      if (!pattern) {
        return
      }

      notesAdapter.updateOne(pattern.notes, {
        id: payload.id,
        changes: {
          start: payload.start,
          duration: payload.duration,
        }
      })
    },

    clearPattern: (state) => {
      const pattern = state.patterns[state.selectedPatternId]

      if (!pattern) {
        return
      }

      notesAdapter.removeAll(pattern.notes)
    },

    setPatterns(state, { payload }: PayloadAction<PianoRollPattern[]>) {
      state.patterns = payload
    },

    setPortamento(state, { payload }: PayloadAction<boolean>) {
      state.portamento = payload
    },

    addPattern(state) {
      const patternId = state.patterns.length

      state.patterns.push({
        id: patternId,
        name: `Pattern ${patternId + 1}`,
        notes: notesAdapter.getInitialState(),
        instrumentId: 0,
      })

      state.selectedPatternId = patternId
    },

    setSelectedPatternId(state, { payload }: PayloadAction<number>) {
      state.selectedPatternId = payload
    },

    setPatternName(state, { payload }: PayloadAction<{ id: number; name: string }>) {
      state.patterns[payload.id].name = payload.name
    },

    setPatternInstrument(state, { payload }: PayloadAction<{ id: number; instrumentId: InstrumentId }>) {
      state.patterns[payload.id].instrumentId = payload.instrumentId
    },
  },
})

const anyEditNoteAction = isAnyOf(upsertNote, removeNote, setNoteDuration, setNoteStart)

export const selectSelectedPattern = createSelector(
  (state: AppState) => state.pianoRoll.patterns,
  (state: AppState) => state.pianoRoll.selectedPatternId,
  (patterns, selectedPattern) => patterns[selectedPattern]
)

const selectPatternNotes = createSelector(
  (state: AppState, _patternId: number) => state.pianoRoll.patterns,
  (_state: AppState, patternId: number) => patternId,
  (patterns, patternId): PianoRollNotes => patterns[patternId]?.notes,
  {
    memoizeOptions: {
      maxSize: 64,
    },
  }
)

export const selectPatternNotesArray = createSelector([selectPatternNotes], (notes: PianoRollNotes): DawNote[] => {
  return notesAdapter.getSelectors().selectAll(notes)
})

export const selectPatternLength = createSelector([selectPatternNotesArray], getDawPaddedPatternLength)

export const selectSelectedPatternNotes = (state: AppState): DawNote[] => {
  return selectPatternNotesArray(state, state.pianoRoll.selectedPatternId)
}

const rootReducer = combineReducers({
  pianoRoll: pianoRollReducer,
})

export function createStore(player: MusicPlayer, initialPatterns?: PianoRollPatterns) {
  const listenerMiddleware = createListenerMiddleware()
  type AppStartListening = TypedStartListening<AppState, AppDispatch>
  const appStartListening = listenerMiddleware.startListening as AppStartListening
  // const appAddListener = addListener as TypedAddListener<AppState, AppDispatch>

  function syncPattern(patternId: number, notes: DawNote[], instrumentId: InstrumentId) {
    player.setPattern(patternId, notesToPattern(notes, instrumentId))
  }

  function syncAllPatterns(state: AppState) {
    const patterns = state.pianoRoll.patterns

    patterns.forEach((pattern, patternId) => {
      const notes = selectPatternNotesArray(state, patternId)
      syncPattern(patternId, notes, pattern.instrumentId)
    })
  }

  appStartListening({
    matcher: anyEditNoteAction,
    effect: (_, { getState }) => {
      const state = getState()
      const selectedPatternNotes = selectSelectedPatternNotes(state)
      const selectedPatternId = state.pianoRoll.selectedPatternId
      const selectedPattern = selectSelectedPattern(state)

      syncPattern(selectedPatternId, selectedPatternNotes, selectedPattern.instrumentId)
    },
  })

  appStartListening({
    actionCreator: setPatternInstrument,
    effect: (action) => {
      player.setPatternInstrument(action.payload.id, action.payload.instrumentId)
    },
  })

  appStartListening({
    predicate: (_, state, prevState) => state.pianoRoll.patterns !== prevState.pianoRoll.patterns,
    effect: (_, { getState }) => {
      const state = getState()
      localStorage.setItem("patterns", JSON.stringify(state.pianoRoll.patterns))
    },
  })

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(listenerMiddleware.middleware),
    preloadedState: {
      pianoRoll: {
        ...pianoRollInitialState,
        patterns: initialPatterns ?? pianoRollInitialState.patterns,
      },
    },
  })

  syncAllPatterns(store.getState())

  return store
}

export type AppState = ReturnType<typeof rootReducer>
export type AppDispatch = ReturnType<typeof createStore>["dispatch"]

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector as TypedUseSelectorHook<AppState>
