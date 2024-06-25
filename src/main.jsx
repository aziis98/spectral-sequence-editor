import { Match, Show, Switch, createEffect, createSignal, onCleanup } from 'solid-js'
import { For, render } from 'solid-js/web'
import { MathText } from './components.jsx'
import { pannable } from './hooks.jsx'

import '@fontsource/inter/latin.css'
import '@fontsource/eb-garamond/latin.css'

const setGridItem = (grid, [r, p, q], value) => {
    grid[`${r} ${p} ${q}`] = value
}

const getGridItem = (grid, [r, p, q]) => {
    return grid[`${r} ${p} ${q}`]
}

const createCell = (r, p, q, initialValue = '') => {
    const [value, setValue] = createSignal(initialValue)

    return {
        index: [r, p, q],

        value,
        setValue,
    }
}

const Cell = ({ cell }) => {
    const [r, p, q] = cell.index

    const [editing, setEditing] = createSignal(false)

    return (
        <div
            classList={{ cell: true, editing: editing() }}
            title={`(r, p, q) = (${r}, ${p}, ${q})`}
            style={{ ['--x']: q, ['--y']: p }}
            onDblClick={() => {
                setEditing(true)
            }}
        >
            <Switch>
                <Match when={editing()}>
                    <input
                        ref={el => {
                            if (el && editing()) {
                                setTimeout(() => {
                                    el.focus()
                                }, 0)
                            }
                        }}
                        type="text"
                        value={cell.value()}
                        onInput={e => cell.setValue(e.target.value.trim())}
                        onBlur={() => setEditing(false)}
                        onKeyUp={e => {
                            if (e.key === 'Escape') {
                                setEditing(false)
                            }
                        }}
                    />
                </Match>
                <Match when={!editing() && cell.value().length === 0}>
                    <div class="empty-cell">+</div>
                </Match>
                <Match when={!editing()}>
                    <MathText value={cell.value} />
                </Match>
            </Switch>
        </div>
    )
}

const App = () => {
    const [currentPage, setCurrentPage] = createSignal(0)

    const [grid, setGrid] = createSignal({})

    const theGrid = grid()
    for (let r = -10; r <= 10; r++) {
        for (let p = -10; p <= 10; p++) {
            for (let q = -10; q <= 10; q++) {
                setGridItem(theGrid, [r, p, q], createCell(r, p, q))
            }
        }
    }
    setGrid(theGrid)

    setGrid(prev => ({
        ...prev,
        '0 0 0': createCell(0, 0, 0, String.raw`\mathbb Z`),
        '0 1 0': createCell(0, 1, 0, String.raw`\mathbb Z`),
        '0 0 1': createCell(0, 0, 1, String.raw`\mathbb Z`),
        '0 1 1': createCell(0, 1, 1, String.raw`\mathbb Z`),
        '0 0 2': createCell(0, 0, 2, String.raw`\mathbb Z`),
        '0 2 0': createCell(0, 2, 0, String.raw`\mathbb Z`),
    }))

    const [lastPan, setLastPan] = createSignal({ x: 0, y: 0 })
    const [pan, setPan] = createSignal({ x: 0, y: 0 })

    onCleanup(() => {
        while (document.body.firstChild) {
            document.body.firstChild.remove()
        }
    })

    return (
        <>
            <header>
                <div class="logo">Spectral Sequences Editor</div>
                <div class="h-fill"></div>
                <div class="toolbar">
                    <button onClick={() => setCurrentPage(currentPage() - 1)}>&minus;</button>
                    <div class="current-page-indicator">
                        <MathText value={() => `r = ${currentPage()}`} />
                    </div>
                    <button onClick={() => setCurrentPage(currentPage() + 1)}>&plus;</button>
                </div>
            </header>
            <main
                use:pannable={{
                    onDown: () => {
                        setLastPan(pan())
                    },
                    onMove: (dx, dy) => {
                        setPan({ x: lastPan().x + dx, y: lastPan().y + dy })
                    },
                }}
                style={{ ['--pan-x']: pan().x.toFixed(2), ['--pan-y']: pan().y.toFixed(2) }}
            >
                <div class="cells">
                    <For
                        each={Object.values(grid()).filter(({ index: [r, _p, _q] }) => {
                            return r === currentPage()
                        })}
                    >
                        {cell => {
                            return <Cell cell={cell} />
                        }}
                    </For>
                </div>
            </main>
        </>
    )
}

render(() => <App />, document.body)
