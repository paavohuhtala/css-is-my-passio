
import React, { Suspense } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { Window } from './common'
import { PianoRoll } from './PianoRoll'
import { PlaybackControls } from './PlaybackControls'
import { setSelectedPatternId, useAppDispatch } from './store'

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #000;
    color: #fff;
    font-family: 'Segoe UI Variable', 'Segoe UI', 'Roboto', sans-serif;
  }
`

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 16px;

  max-height: 100vh;
`

const TopBar = styled.div`
  display: flex;
  flex-direction: row;

  position: sticky;
  top: 0;
  background: black;

  border-bottom: solid 2px white;

  z-index: 100;
`

export function App() {
  return <AppContainer>
    <GlobalStyles/>
    <TopBar>
      <PlaybackControls/>
    </TopBar>
    <PianoRoll lowestOctave={0} highestOctave={6}  />
  </AppContainer>
}