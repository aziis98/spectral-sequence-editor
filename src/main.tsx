import { useSignal } from '@preact/signals'

import { Ref, render } from 'preact'

import {
    Dispatch,
    StateUpdater,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'preact/hooks'

import { useEventListener, useMouse, usePannable } from '@/hooks'
import { applyUpdater, convertRemToPixels } from '@/utils'
import { InfiniteGrid } from '@/grid'
import { drawCanvas } from '@/graphics'
import { generateTikz } from '@/tikz'
import { EditorOptions, Store } from '@/store'
import { Coord2i } from '@/math'

import { Cell } from '@/components/Cell'
import { Options } from '@/components/Options'
import { Icon } from '@/components/Icon'

const GRID_SIZE = convertRemToPixels(6 /* rem */)

type CanvasContext = {
    el: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
}

const updateCanvasContext = (el: HTMLCanvasElement): CanvasContext => {
    console.log('updateCanvasContext')

    el.width = el.offsetWidth * window.devicePixelRatio
    el.height = el.offsetHeight * window.devicePixelRatio

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')

    return { el, ctx }
}

/**
 * MemoCanvas is a memoized version of the <canvas> element, this is to prevent
 * re-rendering the canvas element.
 */
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

    useLayoutEffect(() => {
        remountCanvasContext()
    }, [store.options.showOptions])

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
            if (store.mode === 'homological') {
                store.grid.set(cell.x, cell.y, `E^{${store.r}}_{${cell.x},${cell.y}}`)
            } else {
                store.grid.set(cell.x, cell.y, `E_{${store.r}}^{${cell.x},${cell.y}}`)
            }

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

            mode: store.mode,
            r: store.r,

            pan,
            panning,

            mouse: viewportMouse,
            connectArrowStartCell: $connectArrowStartCell.value,

            gridSize: GRID_SIZE,
            ...store.options,
        })

        // console.timeEnd('render')
    }, [store, store.options.showOptions, pan, panning, viewportMouse, $connectArrowStartCell.value])

    const canvasRefCallback = useCallback((el: HTMLCanvasElement | null) => {
        if (!el) return
        return (canvasRef.current = updateCanvasContext(el))
    }, [])

    return (
        <div
            class="canvas"
            style={{ '--pan-x': pan.x, '--pan-y': pan.y }}
        >
            <MemoCanvas canvasRef={canvasRefCallback} />
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

        r: 0,
        mode: 'homological',

        options: {
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
    window.grid = store.grid

    useEffect(() => {
        setStore(store => {
            store.grid.set(0, 0, 'E_{0,0}^0')
            store.grid.set(1, 0, 'E_{1,0}^0')
            store.grid.set(0, 1, 'E_{0,1}^0')
            store.grid.set(2, 2, 'E_{2,2}^0')
            // store.grid.set(-3, 2, 'E_0^{-3,2}')

            return { ...store }
        })
    }, [])

    const handleExportTikz = () => {
        $exportedCode.value = generateTikz(store.grid, store.extraArrows, {
            r: store.r,
            mode: store.mode,

            ...store.options,
        })
    }

    return (
        <>
            <main>
                <Options
                    // Sidebar visibility
                    isOpen={store.options.showOptions}
                    toggleIsOpen={() =>
                        setOptions(options => ({ ...options, showOptions: !options.showOptions }))
                    }
                    // Editor parameters
                    r={store.r}
                    setR={r => setStore(store => ({ ...store, r: applyUpdater(r, store.r) }))}
                    mode={store.mode}
                    setMode={mode => setStore(store => ({ ...store, mode: applyUpdater(mode, store.mode) }))}
                    // Show options
                    showDotGrid={store.options.showDotGrid}
                    setShowDotGrid={showDotGrid =>
                        setOptions(options => ({
                            ...options,
                            showDotGrid: applyUpdater(showDotGrid, options.showDotGrid),
                        }))
                    }
                    showAxes={store.options.showAxes}
                    setShowAxes={showAxes =>
                        setOptions(options => ({
                            ...options,
                            showAxes: applyUpdater(showAxes, options.showAxes),
                        }))
                    }
                    showDifferentials={store.options.showDifferentials}
                    setShowDifferentials={showDifferentials =>
                        setOptions(options => ({
                            ...options,
                            showDifferentials: applyUpdater(showDifferentials, options.showDifferentials),
                        }))
                    }
                    showExtraArrows={store.options.showExtraArrows}
                    setShowExtraArrows={showExtraArrows =>
                        setOptions(options => ({
                            ...options,
                            showExtraArrows: applyUpdater(showExtraArrows, options.showExtraArrows),
                        }))
                    }
                    // Extra arrows
                    extraArrows={store.extraArrows}
                    setExtraArrows={extraArrows =>
                        setStore(store => ({
                            ...store,
                            extraArrows: applyUpdater(extraArrows, store.extraArrows),
                        }))
                    }
                    // Actions
                    clearGrid={() => setStore(store => ({ ...store, grid: new InfiniteGrid<string>() }))}
                    handleExportTikz={handleExportTikz}
                />
                <Canvas
                    store={store}
                    setStore={setStore}
                />
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
                                    <Icon name="close" />
                                    Close
                                </button>
                                <button
                                    class="primary"
                                    onClick={() => navigator.clipboard.writeText($exportedCode.value!)}
                                >
                                    <Icon name="content_copy" />
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
