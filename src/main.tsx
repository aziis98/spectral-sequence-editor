import { signal, useSignal } from '@preact/signals'
import clsx from 'clsx'
import { Ref, render } from 'preact'
import { Katex } from './components/Katex'
import { useEventListener, useMouse, usePannable } from './hooks'
import { convertRemToPixels } from './utils'
import { Dispatch, StateUpdater, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { InfiniteGrid } from './grid'
import { drawCanvas, drawLatexArrow, renderArrows } from './graphics'
import { generateTikz } from './tikz'
import { EditorOptions, Store } from './store'
import { Coord2i } from './math'
import { Cell } from './components/Cell'

const GRID_SIZE = convertRemToPixels(6 /* rem */)

type CanvasContext = {
    el: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
}

const updateCanvasContext = (el: HTMLCanvasElement): CanvasContext => {
    el.width = el.offsetWidth * window.devicePixelRatio
    el.height = el.offsetHeight * window.devicePixelRatio

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')

    return { el, ctx }
}

const MemoCanvas = ({ canvasRef }: { canvasRef: Ref<HTMLCanvasElement> }) => <canvas ref={canvasRef} />

const Canvas = ({ store, setStore }: { store: Store; setStore: Dispatch<StateUpdater<Store>> }) => {
    const [viewportMouse, mouseRef] = useMouse()
    const [pan, pannableRef, panning] = usePannable<HTMLDivElement>()

    const canvasRef = useRef<CanvasContext | null>(null)

    const remountCanvasContext = () => {
        if (!canvasRef.current) return

        canvasRef.current = updateCanvasContext(canvasRef.current.el)
        setStore(store => ({ ...store }))
    }

    // useEffect(() => {
    //     remountCanvasContext()
    // }, [canvasRef.current, store.options.showOptions])

    useEventListener(window, 'resize', () => {
        remountCanvasContext()
    })

    const untrasform = ({ x, y }: Coord2i): Coord2i => {
        if (!canvasRef.current) throw new Error('Canvas not mounted')

        const g = canvasRef.current.ctx
        return {
            x: x - g.canvas.width / window.devicePixelRatio / 2 - pan.x,
            y: g.canvas.height / window.devicePixelRatio / 2 - y + pan.y,
        }
    }

    const handleCreateCell = (e: MouseEvent) => {
        console.log(e.target)

        if (!(e.target as HTMLElement).matches('.cells')) return

        const mouse = untrasform(viewportMouse)
        const cell = {
            x: Math.floor(mouse.x / GRID_SIZE + 0.5),
            y: Math.floor(mouse.y / GRID_SIZE + 0.5),
        }

        setStore((store: Store) => {
            store.grid.set(cell.x, cell.y, `E_{${store.options.r}}^{${cell.x},${cell.y}}`)
            return {
                ...store,

                grid: store.grid,
                editing: cell,
            }
        })
    }

    const $connectArrowStartCell = useSignal<Coord2i | null>(null)

    const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        if (e.target !== pannableRef.current) return
        if (!e.shiftKey) return

        const mouse = untrasform(viewportMouse)

        $connectArrowStartCell.value = {
            x: Math.floor(mouse.x / GRID_SIZE + 0.5),
            y: Math.floor(mouse.y / GRID_SIZE + 0.5),
        }
    }

    const handlePointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return
        if (!e.shiftKey) return
        if (!$connectArrowStartCell.value) return

        const connectArrowStartCell = $connectArrowStartCell.value

        const mouse = untrasform(viewportMouse)
        const cell = {
            x: Math.floor(mouse.x / GRID_SIZE + 0.5),
            y: Math.floor(mouse.y / GRID_SIZE + 0.5),
        }

        console.log('connect', connectArrowStartCell, cell)

        setStore(store => {
            return {
                ...store,
                extraArrows: [...store.extraArrows, [connectArrowStartCell, cell]],
            }
        })

        $connectArrowStartCell.value = null
    }

    useLayoutEffect(() => {
        if (!canvasRef.current) return
        console.log('render')

        // console.time('render')

        const g = canvasRef.current.ctx

        drawCanvas(g, {
            grid: store.grid,
            extraArrows: store.extraArrows,

            pan,
            panning,

            mouse: viewportMouse,
            connectArrowStartCell: $connectArrowStartCell.value,

            gridSize: GRID_SIZE,
            ...store.options,
        })

        // console.timeEnd('render')
    }, [store, store.options.showOptions, pan, panning, viewportMouse, $connectArrowStartCell.value])

    // Remove empty cells
    // ;[...store.grid].forEach(([[x, y], content]) => {
    //     if (cell && cell.value.trim().length === 0) {
    //         $grid.value.delete(x, y)
    //         $gridRefresh.value += 1
    //     }
    // })

    // HACK: force re-render
    // console.log($gridRefresh.value)

    return (
        <div class="canvas" style={{ '--pan-x': pan.x, '--pan-y': pan.y }}>
            <MemoCanvas
                canvasRef={el => {
                    if (!el) return
                    return (canvasRef.current = updateCanvasContext(el))
                }}
            />
            <div
                class="cells"
                ref={el => {
                    pannableRef.current = el
                    mouseRef.current = el
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onDblClick={handleCreateCell}
            >
                {Array.from(store.grid).map(([[x, y], content]) => (
                    <Cell
                        coord={{ x, y }}
                        editing={store.editing?.x === x && store.editing?.y === y}
                        content={content}
                        setContent={content => {
                            if (content.trim().length === 0) {
                                setStore(store => {
                                    store.grid.delete(x, y)
                                    return { ...store, grid: store.grid }
                                })
                            } else {
                                setStore(store => {
                                    store.grid.set(x, y, content)
                                    return { ...store, grid: store.grid }
                                })
                            }
                        }}
                        setEditing={newEditing => {
                            setStore(store => {
                                return { ...store, editing: newEditing ? { x, y } : null }
                            })
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

const App = () => {
    const [store, setStore] = useState<Store>({
        grid: new InfiniteGrid<string>(),
        extraArrows: [],
        editing: null,
        options: {
            r: 0,
            showOptions: true,
            showDotGrid: true,
            showAxes: true,
            showDifferentials: true,
            showExtraArrows: true,
        },
    })

    const setOptions: Dispatch<StateUpdater<EditorOptions>> = options => {
        setStore(store => {
            return {
                ...store,
                options: typeof options === 'function' ? options(store.options) : options,
            }
        })
    }

    const $exportedCode = useSignal<string | null>(null)

    // @ts-ignore
    window.$grid = store.grid

    useEffect(() => {
        setStore(store => {
            store.grid.set(0, 0, 'E_1^{0,0}')
            store.grid.set(1, 0, 'E_1^{1,0}')
            store.grid.set(0, 1, 'E_1^{0,1}')
            store.grid.set(2, 2, 'E_1^{2,2}')
            store.grid.set(-3, 2, 'E_1^{-3,2}')

            return { ...store }
        })
    }, [])

    const handleExportTikz = () => {
        $exportedCode.value = generateTikz(store.grid, {
            ...store.options,
        })
    }

    return (
        <>
            <main>
                <div class={clsx('options', 'stack-v', store.options.showOptions && 'open')}>
                    <section>
                        <h1>Spectral Sequence Editor</h1>
                        <h2>
                            by <a href="https://aziis98.com">@aziis98</a>
                        </h2>
                    </section>
                    <hr />
                    <p>
                        To create a new cell, double click on an empty dot. To edit a cell, double click on it. To
                        connect two cells with an arrow, drag from one cell to another while holding <kbd>Shift</kbd>.
                    </p>
                    <hr />
                    <h3>Options</h3>
                    <div class="option">
                        <h4>Sequence Page</h4>
                        <div class="row">
                            <button
                                class="square"
                                onClick={() => setOptions(options => ({ ...options, r: store.options.r - 1 }))}
                            >
                                <div class="icon">remove</div>
                            </button>
                            <input
                                id="sequence-page"
                                type="number"
                                class="fill"
                                value={store.options.r}
                                onInput={e => setOptions(options => ({ ...options, r: e.currentTarget.valueAsNumber }))}
                            />
                            <button
                                class="square"
                                onClick={() => setOptions(options => ({ ...options, r: store.options.r + 1 }))}
                            >
                                <div class="icon">add</div>
                            </button>
                        </div>
                    </div>
                    <div class="option">
                        <h4>Toggles</h4>
                        <div class="row">
                            <input
                                type="checkbox"
                                id="option-show-dot-grid"
                                checked={store.options.showDotGrid}
                                onInput={e =>
                                    setOptions(options => ({ ...options, showDotGrid: e.currentTarget.checked }))
                                }
                            />
                            <label for="option-show-dot-grid">Dot Grid</label>
                        </div>
                        <div class="row">
                            <input
                                type="checkbox"
                                id="option-show-axes"
                                checked={store.options.showAxes}
                                onInput={e =>
                                    setOptions(options => ({ ...options, showAxes: e.currentTarget.checked }))
                                }
                            />
                            <label for="option-show-axes">Axes</label>
                        </div>
                        <div class="row">
                            <input
                                type="checkbox"
                                id="option-show-page-arrows"
                                checked={store.options.showDifferentials}
                                onInput={e =>
                                    setOptions(options => ({ ...options, showDifferentials: e.currentTarget.checked }))
                                }
                            />
                            <label for="option-show-page-arrows">Differentials</label>
                        </div>
                    </div>
                    <hr />
                    <div class="option">
                        <h3>Extra Arrows</h3>
                        <p>
                            To add an arrow, drag from a cell to another cell while holding <kbd>Shift</kbd>.
                        </p>
                        {store.extraArrows.map(([{ x: startCellX, y: startCellY }, { x: endCellX, y: endCellY }]) => (
                            <div class="row">
                                <div class="fill">
                                    <Katex value={`(${startCellX},${startCellY}) \\to (${endCellX},${endCellY})`} />
                                </div>
                                <button class="square">
                                    <div class="icon">delete</div>
                                </button>
                            </div>
                        ))}
                        <div class="row">
                            <button
                                id="sequence-clear-extra-arrows-btn"
                                onClick={() => setStore({ ...store, extraArrows: [] })}
                            >
                                <div class="icon">delete</div>
                                Clear Arrows
                            </button>
                        </div>
                    </div>
                    <hr />
                    <div class="option">
                        <h3>Actions</h3>
                        <div class="row">
                            <button
                                id="sequence-clear-btn"
                                onClick={() => {
                                    setStore({ ...store, grid: new InfiniteGrid() })
                                }}
                            >
                                <div class="icon">delete</div>
                                Clear Grid
                            </button>
                            <button id="sequence-export-btn" onClick={handleExportTikz}>
                                <div class="icon">exit_to_app</div>
                                Export <em>tikzcd</em>
                            </button>
                        </div>
                    </div>
                    <hr />
                </div>
                <div class="options-side-buttons">
                    <button
                        class="square"
                        onClick={() => setOptions(options => ({ ...options, showOptions: !options.showOptions }))}
                    >
                        <div class="icon">{store.options.showOptions ? 'chevron_left' : 'chevron_right'}</div>
                    </button>
                </div>
                <Canvas store={store} setStore={setStore} />
            </main>
            {$exportedCode.value && (
                <div class="modal-container">
                    <div class="modal">
                        <div class="title">
                            <h2>Exported Tikz</h2>
                        </div>
                        <div class="content">
                            {/* prettier-ignore */}
                            <pre><code>{$exportedCode.value}</code></pre>
                        </div>
                        <div class="actions">
                            <div class="row">
                                <button onClick={() => ($exportedCode.value = null)}>
                                    <div class="icon">close</div>
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText($exportedCode.value!)
                                    }}
                                >
                                    <div class="icon">content_copy</div>
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

render(<App />, document.body)
