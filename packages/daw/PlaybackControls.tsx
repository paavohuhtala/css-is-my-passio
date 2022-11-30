import React from "react"
import styled from "styled-components"
import { MusicPlayerContext } from "./player"
import {
  addPattern,
  clearPattern,
  PianoRollPattern,
  selectSelectedPatternNotes,
  setPatternInstrument,
  setPatternName,
  setPortamento,
  setSelectedPatternId,
  useAppDispatch,
  useAppSelector,
} from "./store"
import { instruments } from "./types"
import { delta, notesToPattern } from "./conversion"

const Button = styled.button`
  margin: 0px;
  border: none;
  border: solid 2px black;
  padding: 16px;
  line-height: 24px;
  font-size: 18px;
  height: 60px;

  cursor: pointer;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 8px;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`

const Dropdown = styled.select`
  margin: 0px;
  border: none;
  padding: 16px;
  line-height: 24px;
  font-size: 18px;
  height: 60px;

  cursor: pointer;
`

const TextInput = styled.input`
  margin: 0px;
  border: none;
  padding: 16px;
  line-height: 24px;
  font-size: 18px;
  height: 60px;
`

const Toggle = styled.input`
  margin: 0px;
`
Toggle.defaultProps = {
  type: "checkbox",
}

const Label = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
`

export function PlaybackControls() {
  const dispatch = useAppDispatch()
  const player = React.useContext(MusicPlayerContext)!
  const isPortamento = useAppSelector((state) => state.pianoRoll.portamento)
  const patterns = useAppSelector((state) => state.pianoRoll.patterns)
  const selectedPatternId = useAppSelector((state) => state.pianoRoll.selectedPatternId)
  const selectedPattern = patterns[selectedPatternId] as PianoRollPattern | undefined
  const notes = useAppSelector(selectSelectedPatternNotes)

  const togglePortamenmto = React.useCallback(() => {
    dispatch(setPortamento(!isPortamento))
  }, [dispatch, isPortamento])

  React.useEffect(() => {
    document.addEventListener("keydown", async (e) => {
      if (e.target !== document.body) {
        return
      }

      if (e.key === " ") {
        e.preventDefault()
        e.stopPropagation()

        await player.toggle()
      } else if (e.key === "Backspace") {
        e.preventDefault()
        e.stopPropagation()

        await player.stop()
        await player.start()
      }
    })
  }, [player])

  const onChangePattern = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(setSelectedPatternId(Number(e.target.value)))
    },
    [dispatch]
  )

  const onChangePatternName = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(
        setPatternName({
          id: selectedPatternId,
          name: e.target.value,
        })
      )
    },
    [dispatch, selectedPatternId]
  )

  const onChangeInstrument = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(
        setPatternInstrument({
          id: selectedPatternId,
          instrumentId: Number(e.target.value),
        })
      )
    },
    [dispatch, selectedPatternId]
  )

  const onCopyPattern = React.useCallback(() => {
    const pattern = notesToPattern(notes, selectedPattern!.instrumentId)
    const compressed = delta(pattern)
    navigator.clipboard.writeText(JSON.stringify(compressed))
  }, [notes])

  const onToggleSolo = React.useCallback(() => {
    player.sharedState.soloPatternId = player.sharedState.soloPatternId === selectedPatternId ? undefined : selectedPatternId
  }, [player, selectedPatternId])

  return (
    <Container>
      <Row>
        <Button onClick={() => player.start()}>Play</Button>
        <Button onClick={() => player.stop()}>Stop</Button>
        <Button onClick={togglePortamenmto}>{isPortamento ? "Portamento ON" : "Portamento OFF"}</Button>
        <Dropdown value={selectedPatternId} onChange={onChangePattern}>
          {patterns.map((pattern, id) => (
            <option key={id} value={id}>
              {pattern.name || `Pattern ${id}`}
            </option>
          ))}
        </Dropdown>
        <Button onClick={() => dispatch(addPattern())}>+</Button>
        <Button onClick={onToggleSolo}>
          Toggle solo
        </Button>
      </Row>

      <Row>
        <TextInput value={selectedPattern?.name ?? ``} onChange={onChangePatternName} width={30} />
        <Dropdown value={selectedPattern?.instrumentId ?? "undefined"} onChange={onChangeInstrument}>
          {instruments.map((instrument, id) => (
            <option key={id} value={id}>
              {instrument.name}
            </option>
          ))}
        </Dropdown>
        <Button onClick={() => dispatch(clearPattern())}>Clear</Button>
        <Button onClick={onCopyPattern}>Copy to Clipboard</Button>
      </Row>
    </Container>
  )
}
