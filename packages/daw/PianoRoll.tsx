import React, { CSSProperties } from "react"
import styled, { css } from "styled-components"
import { KEY_WIDTH, NOTE_HEIGHT, NOTE_WIDTH } from "./common"
import { PianoRollNote } from "./Note"
import { MusicPlayerContext } from "./player"
import { selectSelectedPatternNotes, upsertNote, useAppDispatch, useAppSelector } from "./store"
import { DawNote, getDawPaddedPatternLength, KeyName, keys, namedKeyToMidi } from "./types"
import { rangeArray } from "./utils"

import "./assets/assets.scss"
import { useSelector } from "react-redux"
import { nanoid } from "@reduxjs/toolkit"

const KeyContainer = styled.div<{ isBlack: boolean }>`
  display: flex;
  flex-direction: column;

  height: ${NOTE_HEIGHT}px;

  background-color: ${(props) => (props.isBlack ? "black" : "white")};
  color: ${(props) => (props.isBlack ? "white" : "black")};
  border: solid 1px black;

  line-height: 24px;
  font-size: 18px;
  font-weight: bold;

  position: sticky;
  left: 0;
  top: 0;
`

export const PianoRollKey = React.memo(({ keyName, octave }: { keyName: KeyName; octave: number }) => {
  return (
    <KeyContainer isBlack={keyName.endsWith("#")}>
      {keyName} {octave}
    </KeyContainer>
  )
})
PianoRollKey.displayName = "PianoRollKey"

const PianoRollContainer = styled.div`
  width: 100%;
  position: relative;
  overflow: scroll;

  display: grid;
  grid-template:
    "markers markers"
    "keys notes";

  grid-template-rows: 24px 1fr;
  grid-template-columns: ${KEY_WIDTH}px 1fr;
  background: white;
`

const KeysContainer = styled.div`
  grid-area: keys;

  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  min-width: ${KEY_WIDTH}px;
  flex-direction: column;

  grid-template-columns: ${KEY_WIDTH}px;
  grid-template-rows: repeat(12, max-content);
  width: max-content;

  position: sticky;
  left: 0;
  z-index: 51;
`

const NotesContainer = styled.div`
  grid-area: notes;

  display: flex;
  flex-direction: row;
  position: relative;

  width: 100%;
  height: 100%;
  cursor: pointer;
`

const PianoRollBackground = styled.div<{ isGhost?: boolean, patternLength: number }>`
  background: var(--pianoRollBackground);
  background-repeat: repeat;
  background-size: 192px 24px;
  background-attachment: local;

  min-width: ${(props) => props.patternLength * NOTE_WIDTH}px;

  ${(props) => props.isGhost ? css`
    filter: brightness(0.4);
    flex-grow: 1;
    flex-shrink: 1;
  ` : css`
    flex-grow: 0;
    flex-shrink: 0;
  `}
`

const PositionIndicatorContainer = styled.div`
  position: absolute;
  width: 4px;
  height: 100%;
  background: red;
  z-index: 50;
`

function PositionIndicator() {
  const player = React.useContext(MusicPlayerContext)!
  const selectedPatternId = useAppSelector((state) => state.pianoRoll.selectedPatternId)

  const [position, setPosition] = React.useState(0)

  React.useEffect(() => {
    return player.on("patternAdvance", ({ patternId, patternTime }) => {
      if (patternId === selectedPatternId) {
        setPosition(patternTime)
      }
    })
  }, [player, selectedPatternId])

  const inlineStyle: CSSProperties = React.useMemo(() => {
    return {
      transform: `translateX(${position * NOTE_WIDTH}px)`,
    }
  }, [position])

  return <PositionIndicatorContainer style={inlineStyle} />
}

interface NotesProps {
  notes: DawNote[]

  lowestOctave: number
  highestOctave: number
  patternLength: number
}

function Notes({ notes, lowestOctave, highestOctave, patternLength }: NotesProps) {
  const dispatch = useAppDispatch()

  const containerRef = React.useRef<HTMLDivElement>(null)
  const highestNote = React.useMemo(() => namedKeyToMidi({ name: "B", octave: highestOctave }), [highestOctave])
  const lowestNote = React.useMemo(() => namedKeyToMidi({ name: "C", octave: lowestOctave }), [lowestOctave])

  const onClickContainer = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger on left click
    if (e.button !== 0) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current!
    const containerRect = container.getBoundingClientRect()

    const relativeY = e.clientY - containerRect.top
    const relativeX = e.clientX - containerRect.left

    const noteIndex = Math.floor(relativeY / NOTE_HEIGHT)
    const note = highestNote - noteIndex
    const start = Math.floor(relativeX / NOTE_WIDTH)

    dispatch(upsertNote({
      id: nanoid(),
      start,
      duration: 1,
      note,
    }))

  }, [dispatch, highestNote])

  return (
    <NotesContainer ref={containerRef} onMouseDown={onClickContainer}>
        <PianoRollBackground patternLength={patternLength} />
        <PianoRollBackground patternLength={16} isGhost />

        <PositionIndicator />
        {notes.map((note) => {
          return <PianoRollNote note={note} key={note.id} highestNote={highestNote} lowestNote={lowestNote} />
        })}
    </NotesContainer>
  )
}

const BeatMarkersContainer = styled.div<{ patternLength: number }>`
  grid-area: markers;
  align-self: start;

  width: 100%;

  position: sticky;
  padding-left: ${KEY_WIDTH}px;
  top: 0;
  background: white;
  z-index: 100;

  display: grid;
  grid-template-columns: repeat(${(props) => props.patternLength / 16}, ${16 * NOTE_WIDTH}px);
  border-bottom: 1px solid black;
`

const BeatMarker = styled.span`
  line-height: 24px;
  font-size: 18px;

  color: black;
`

interface PianoRollProps {
  highestOctave: number
  lowestOctave: number
}

export function PianoRoll({ highestOctave, lowestOctave }: PianoRollProps) {
  const patternNotes = useSelector(selectSelectedPatternNotes)

  const octaveKeys = React.useMemo(() => {
    const octaves = rangeArray(lowestOctave, highestOctave + 1).reverse()
    const reversedKeys = [...keys].reverse()

    return octaves.flatMap((octave) => {
      return reversedKeys.map((key) => ({ name: key, octave }))
    })
  }, [highestOctave, lowestOctave])
  

  const patternLength = React.useMemo(() => {
    return getDawPaddedPatternLength(patternNotes)
  }, [patternNotes])

  const beatMarkers = React.useMemo(() => {
    return rangeArray(0, patternLength / 16).map(beat => beat + 1)
  }, [patternLength])

  const onContextMenu = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <PianoRollContainer onContextMenu={onContextMenu}>
      <BeatMarkersContainer patternLength={patternLength}>
        {beatMarkers.map((beat) => <BeatMarker key={beat}>{beat}</BeatMarker>)}
      </BeatMarkersContainer>
      <KeysContainer>
        {octaveKeys.map((key, i) => (
          <React.Fragment key={`${key.name}-${key.octave}`}>
            <PianoRollKey key={key.name} octave={key.octave} keyName={key.name} />
          </React.Fragment>
        ))}
      </KeysContainer>
      <Notes notes={patternNotes} patternLength={patternLength} highestOctave={highestOctave} lowestOctave={lowestOctave} />
    </PianoRollContainer>
  )
}
