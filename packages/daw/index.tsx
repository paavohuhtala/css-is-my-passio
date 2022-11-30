
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import { createStore, PianoRollPatterns, setPatterns } from './store'
import { Provider } from 'react-redux'
import { createPlayer, MusicPlayerContext } from './player'

const savedPatternsJson = localStorage.getItem('patterns')
let savedPatterns: PianoRollPatterns | undefined = undefined

if (savedPatternsJson) {
  savedPatterns = JSON.parse(savedPatternsJson)
}

const player = createPlayer()
const store = createStore(player, savedPatterns)

const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={store}>
    <MusicPlayerContext.Provider value={player}>
      <App/>
    </MusicPlayerContext.Provider>
  </Provider>,
)
