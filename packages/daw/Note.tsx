import React, { CSSProperties } from "react"
import styled, { createGlobalStyle, css } from "styled-components"
import { NOTE_HEIGHT, NOTE_WIDTH } from "./common"
import { upsertNote, removeNote, setNoteDuration, setNoteStart, useAppDispatch } from "./store"
import { DawNote } from "./types"

const NoteContainer = styled.button<{ isPortamento: boolean}>`
  height: ${NOTE_HEIGHT}px;
  position: absolute;

  background: #4028aa;
  border: solid 1px black;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;

  cursor: grab;

  box-shadow: inset 0 0 4px 1px rgba(0, 0, 0, 0.2);

  ${(props) => props.isPortamento && css`
    background: #bd2121;
  `}
`

const NoteGrabber = styled.div`
  width: 4px;
  background: #947cff;
  cursor: e-resize;
`

interface NoteProps {
  note: DawNote
  
  lowestNote: number
  highestNote: number
}

type GrabAxis = "left" | "right" | "center"
const GrabbingCss = createGlobalStyle<{ grabAxis: GrabAxis }>`
  * {
    cursor: ${(props) => (props.grabAxis === "center" ? "grabbed" : "e-resize")} !important;
  }
`

export const PianoRollNote = React.memo(({ note, lowestNote, highestNote }: NoteProps) => {
  const dispatch = useAppDispatch()

  const onContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  const onRightClick = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      dispatch(removeNote(note))
    },
    [dispatch]
  )

  const [dragging, setDragging] = React.useState<"left" | "right" | "center" | undefined>(undefined)

  const [visualDuration, setVisualDuration] = React.useState(note.duration)
  const visualDurationRef = React.useRef(visualDuration)

  const [visualStart, setVisualStart] = React.useState(note.start)
  const visualStartRef = React.useRef(visualStart)

  const [visualKeyOffset, setVisualKeyOffset] = React.useState(0)
  const visualKeyOffsetRef = React.useRef(visualKeyOffset)

  const duration = dragging ? visualDuration : note.duration
  const start = dragging ? visualStart : note.start

  const startDragPosX = React.useRef<number | null>(null)
  const startDragInnerPosX = React.useRef<number | null>(null)
  const startDragPosY = React.useRef<number | null>(null)

  function startGrabbing(e: React.MouseEvent<HTMLElement, MouseEvent>, axis: "left" | "right" | "center") {
    e.stopPropagation()
    e.preventDefault()

    const minTrackOffset = -(highestNote - note.note)
    const maxTrackOffset = note.note - lowestNote

    function onMove(e: MouseEvent) {
      if (axis === "right") {
        const newDuration = Math.max(1, duration + Math.round((e.clientX - startDragPosX.current!) / NOTE_WIDTH))
        visualDurationRef.current = newDuration

        setVisualDuration(newDuration)
      } else if (axis === "center") {
        // Use startDragInnerPosX to avoid jumping when grabbing the note
        const newStart = Math.max(
          0,
          start + Math.round((e.clientX - startDragPosX.current! - startDragInnerPosX.current!) / NOTE_WIDTH)
        )
        visualStartRef.current = newStart

        // Also calculate a Y offset, if any
        const newKeyOffset = Math.max(
          minTrackOffset,
          Math.min(maxTrackOffset, Math.floor((e.clientY - startDragPosY.current!) / NOTE_HEIGHT))
        )

        visualKeyOffsetRef.current = newKeyOffset
        setVisualStart(newStart)
        setVisualKeyOffset(newKeyOffset)
      } else if (axis === "left") {
        const newStart = Math.max(0, start + Math.round((e.clientX - startDragPosX.current!) / NOTE_WIDTH))
        const newDuration = Math.max(1, duration - (newStart - start))

        visualStartRef.current = newStart
        visualDurationRef.current = newDuration
        setVisualStart(newStart)
        setVisualDuration(newDuration)
      }

      e.preventDefault()
      e.stopPropagation()
    }

    const rect = e.currentTarget.getBoundingClientRect()
    startDragPosX.current = rect.left
    startDragInnerPosX.current = e.clientX - rect.left
    startDragPosY.current = rect.top

    setDragging(axis)
    visualDurationRef.current = visualDuration
    setVisualDuration(visualDuration)
    visualStartRef.current = visualStart
    setVisualStart(visualStart)
    visualKeyOffsetRef.current = 0
    setVisualKeyOffset(0)

    document.addEventListener("mousemove", onMove)

    function onMouseUp() {
      document.removeEventListener("mousemove", onMove)
      startDragPosX.current = null
      startDragInnerPosX.current = null
      startDragPosY.current = null

      setDragging(undefined)

      const startChanged = visualStartRef.current !== note.start
      const durationChanged = visualDurationRef.current !== note.duration
      const yChanged = axis === "center" && visualKeyOffsetRef.current !== 0

      if (!startChanged && !yChanged && durationChanged) {
        dispatch(setNoteDuration({ id: note.id, duration: visualDurationRef.current }))
      } else if (startChanged && !yChanged) {
        dispatch(
          setNoteStart({
            id: note.id,
            start: visualStartRef.current,
            duration: visualDurationRef.current,
          })
        )
      } else {
        dispatch(
          upsertNote({
            ...note,
            start: visualStartRef.current,
            duration: visualDurationRef.current,
            note: note.note - visualKeyOffsetRef.current,
          })
        )
      }
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mouseup", onMouseUp)
  }

  const onMouseDown = (e: React.MouseEvent<HTMLElement, MouseEvent>, axis?: "left" | "right" | "center") => {
    console.log({ e })

    if (e.button === 0) {
      startGrabbing(e, axis ?? "center")
    } else if (e.button === 2) {
      onRightClick(e)
    }
  }

  const inlineStyle: CSSProperties = React.useMemo(
    () => ({
      left: `${start * NOTE_WIDTH}px`,
      top: `${(highestNote - note.note + (dragging ? visualKeyOffset : 0)) * NOTE_HEIGHT}px`,
      width: `${duration * NOTE_WIDTH}px`,
    }),
    [start, duration, visualKeyOffset, dragging, note.note]
  )

  return (
    <NoteContainer style={inlineStyle} onContextMenu={onContextMenu} onMouseDown={(e) => onMouseDown(e, "center")} isPortamento={note.portamento ?? false}>
      <NoteGrabber onMouseDown={(e) => startGrabbing(e, "left")} />
      <NoteGrabber onMouseDown={(e) => startGrabbing(e, "right")} />
      {dragging && <GrabbingCss grabAxis={dragging} />}
    </NoteContainer>
  )
})
PianoRollNote.displayName = "PianoRollNote"
