import { Dispatch, StateUpdater } from 'preact/hooks'

import clsx from 'clsx'

import { Coord2i } from '@/math'
import { Katex } from '@/components/Katex'
import { Icon } from './Icon'

const ToggleOption = ({
    id,
    label,
    checked,
    onInput,
}: {
    id: string
    label: string
    checked: boolean
    onInput: (checked: boolean) => void
}) => (
    <div class="row">
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onInput={e => onInput(e.currentTarget.checked)}
        />
        <label for={id}>{label}</label>
    </div>
)

type Props = {
    isOpen: boolean
    toggleIsOpen: () => void

    r: number
    setR: Dispatch<StateUpdater<number>>

    mode: 'homological' | 'cohomological'
    setMode: Dispatch<StateUpdater<'homological' | 'cohomological'>>

    showDotGrid: boolean
    setShowDotGrid: Dispatch<StateUpdater<boolean>>
    showAxes: boolean
    setShowAxes: Dispatch<StateUpdater<boolean>>
    showDifferentials: boolean
    setShowDifferentials: Dispatch<StateUpdater<boolean>>
    showExtraArrows: boolean
    setShowExtraArrows: Dispatch<StateUpdater<boolean>>

    extraArrows: [Coord2i, Coord2i][]
    setExtraArrows: Dispatch<StateUpdater<[Coord2i, Coord2i][]>>

    clearGrid: () => void
    handleExportTikz: () => void
}

export const Options = ({
    isOpen,
    toggleIsOpen,

    r,
    setR,
    mode,
    setMode,

    showDotGrid,
    setShowDotGrid,
    showAxes,
    setShowAxes,
    showDifferentials,
    setShowDifferentials,
    showExtraArrows,
    setShowExtraArrows,

    extraArrows,
    setExtraArrows,

    clearGrid,
    handleExportTikz,
}: Props) => {
    return (
        <>
            <div class={clsx('options', 'stack-v', isOpen && 'open')}>
                <section>
                    <h1>Spectral Sequence Editor</h1>
                    <h2>
                        by <a href="https://aziis98.com">@aziis98</a>
                    </h2>
                </section>
                <hr />
                <p>
                    To create a new cell, double click on an empty dot. To edit a cell, double click on it. To
                    connect two cells with an arrow, drag from one cell to another while holding{' '}
                    <kbd>Shift</kbd>.
                </p>
                <hr />
                <h3>Options</h3>
                <div class="option">
                    <h4>Diagram</h4>
                    <div class="row">
                        <input
                            type="checkbox"
                            class="slider"
                            id="option-mode-homological"
                            checked={mode === 'cohomological'}
                            onInput={e => setMode(e.currentTarget.checked ? 'cohomological' : 'homological')}
                        />
                        <label for="option-mode-homological">
                            {mode === 'homological' ? 'Homological' : 'Cohomological'}
                        </label>
                    </div>
                    <div class="row">
                        <button
                            class="square"
                            onClick={() => setR(r => r - 1)}
                        >
                            <Icon name="remove" />
                        </button>
                        <input
                            type="number"
                            class="fill"
                            value={r}
                            onInput={e => setR(e.currentTarget.valueAsNumber)}
                        />
                        <button
                            class="square"
                            onClick={() => setR(r => r + 1)}
                        >
                            <Icon name="add" />
                        </button>
                    </div>
                </div>
                <div class="option">
                    <h4>Toggles</h4>
                    <ToggleOption
                        id="option-show-dot-grid"
                        label="Dot Grid"
                        checked={showDotGrid}
                        onInput={setShowDotGrid}
                    />
                    <ToggleOption
                        id="option-show-axes"
                        label="Axes"
                        checked={showAxes}
                        onInput={setShowAxes}
                    />
                    <ToggleOption
                        id="option-show-page-arrows"
                        label="Differentials"
                        checked={showDifferentials}
                        onInput={setShowDifferentials}
                    />
                    <ToggleOption
                        id="option-show-extra-arrows"
                        label="Extra Arrows"
                        checked={showExtraArrows}
                        onInput={setShowExtraArrows}
                    />
                </div>
                <hr />
                <div class="option">
                    <h3>Extra Arrows</h3>
                    <p>
                        To add an arrow, drag from a cell to another cell while holding <kbd>Shift</kbd>.
                    </p>
                    {extraArrows.map(([{ x: startCellX, y: startCellY }, { x: endCellX, y: endCellY }]) => (
                        <div class="row">
                            <div class="fill">
                                <Katex
                                    value={`(${startCellX},${startCellY}) \\to (${endCellX},${endCellY})`}
                                />
                            </div>
                            <button class="square">
                                <Icon name="delete" />
                            </button>
                        </div>
                    ))}
                    <div class="row">
                        <button onClick={() => setExtraArrows([])}>
                            <Icon name="delete" />
                            Clear Arrows
                        </button>
                    </div>
                </div>
                <hr />
                <div class="option">
                    <h3>Actions</h3>
                    <div class="row">
                        <button onClick={() => clearGrid()}>
                            <Icon name="delete" />
                            Clear Grid
                        </button>
                        <button
                            class="primary"
                            onClick={handleExportTikz}
                        >
                            <Icon name="exit_to_app" />
                            Export <em>tikzcd</em>
                        </button>
                    </div>
                </div>
                <hr />
            </div>
            <div class="options-side-buttons">
                <button
                    class="square"
                    onClick={() => toggleIsOpen()}
                >
                    <Icon name={isOpen ? 'chevron_left' : 'chevron_right'} />
                </button>
            </div>
        </>
    )
}
