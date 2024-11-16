import { signal, Signal, useSignal } from '@preact/signals'
import clsx from 'clsx'
import { Ref, render } from 'preact'
import { Katex } from './components/Katex'
import { useMouse, usePannable } from './hooks'
import { convertRemToPixels } from './utils'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import { InfiniteGrid } from './grid'
import { drawLatexArrow, Point, renderArrows } from './graphics'

const GRID_SIZE = convertRemToPixels(6 /* rem */)

type GridCell = Signal<{
    editing: boolean
    value: string
}>

const MemoCanvas = ({ canvasRef }: { canvasRef: Ref<HTMLCanvasElement> }) => <canvas ref={canvasRef} />

const Cell = ({ x, y, $cell }: { x: number; y: number; $cell: GridCell }) => {
    const cell = $cell.value

    return (
        <div
            class={clsx('cell', cell.editing && 'editing')}
            style={{ '--x': x, '--y': y }}
            onDblClick={() =>
                ($cell.value = {
                    ...cell,
                    editing: true,
                })
            }
        >
            {cell.editing ? (
                <input
                    type="text"
                    value={cell.value}
                    ref={el => el?.focus()}
                    onKeyDown={e => {
                        console.log(e.key)
                        if (e.key === 'Enter') {
                            $cell.value = {
                                editing: false,
                                value: e.currentTarget.value,
                            }
                        }
                        if (e.key === 'Escape') {
                            $cell.value = {
                                editing: false,
                                value: cell.value,
                            }
                        }
                    }}
                    onBlur={e => {
                        $cell.value = {
                            editing: false,
                            value: e.currentTarget.value,
                        }
                    }}
                />
            ) : (
                <Katex value={cell.value} />
            )}
        </div>
    )
}

const Canvas = ({
    $grid,
    $gridRefresh,
    $optionPageIndex,
    $extraArrows,
}: {
    $grid: Signal<InfiniteGrid<GridCell>>
    $gridRefresh: Signal<number>
    $optionPageIndex: Signal<number>
    $extraArrows: Signal<[Point, Point][]>
}) => {
    const [$mouse, mouseRef] = useMouse()
    const [$pan, pannableRef] = usePannable<HTMLDivElement>()
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

    const untrasform = ([x, y]: Point) => {
        const g = ctxRef.current!
        return [x - g.canvas.width / 2 - $pan.value.x, g.canvas.height / 2 - y + $pan.value.y]
    }

    const handleCreateCell = (e: MouseEvent) => {
        console.log(e.target)

        if (!(e.target as HTMLElement).matches('.cells')) return

        const [mouseX, mouseY] = untrasform([$mouse.value.x, $mouse.value.y])
        const [cellX, cellY] = [Math.floor(mouseX / GRID_SIZE + 0.5), Math.floor(mouseY / GRID_SIZE + 0.5)]

        $grid.value.set(
            cellX,
            cellY,
            signal({
                editing: true,
                value: `E_{${$optionPageIndex.value}}^{${cellX},${cellY}}`,
            })
        )
        $gridRefresh.value += 1
    }

    const $arrowStartCell = useSignal<[number, number] | null>(null)

    const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        if (e.target !== pannableRef.current) return
        if (!e.shiftKey) return

        $arrowStartCell.value = untrasform([$mouse.value.x, $mouse.value.y]).map(v =>
            Math.floor(v / GRID_SIZE + 0.5)
        ) as [number, number]
    }

    const handlePointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return
        if (!e.shiftKey) return
        if (!$arrowStartCell.value) return

        const [cellX, cellY] = untrasform([$mouse.value.x, $mouse.value.y]).map(v =>
            Math.floor(v / GRID_SIZE + 0.5)
        ) as [number, number]

        console.log('connect', $arrowStartCell.value, [cellX, cellY])
        $extraArrows.value = [...$extraArrows.value, [$arrowStartCell.value, [cellX, cellY]]]
        $arrowStartCell.value = null
    }

    const canvasRefCallback = useCallback(
        (el: HTMLCanvasElement | null) => {
            if (!el) return

            console.log('canvas mounted')

            el.width = el.offsetWidth
            el.height = el.offsetHeight

            ctxRef.current = el.getContext('2d')
        },
        [$gridRefresh.value]
    )

    useEffect(() => {
        if (!ctxRef.current) return
        // console.time('render')

        const g = ctxRef.current

        g.resetTransform()
        g.clearRect(0, 0, g.canvas.width, g.canvas.height)

        g.translate(g.canvas.width / 2, g.canvas.height / 2)
        g.translate($pan.value.x, $pan.value.y)
        g.scale(1, -1)

        // Dot grid
        g.fillStyle = '#ccc'
        g.lineWidth = 1

        const viewportCenterX = -($pan.value.x / GRID_SIZE) | 0
        const viewportCenterY = ($pan.value.y / GRID_SIZE) | 0

        const RADIUS = 10

        for (let i = viewportCenterX - RADIUS; i <= viewportCenterX + RADIUS; i++) {
            for (let j = viewportCenterY - RADIUS; j <= viewportCenterY + RADIUS; j++) {
                g.beginPath()
                g.arc(i * GRID_SIZE, j * GRID_SIZE, 2, 0, 2 * Math.PI)
                g.fill()
            }
        }

        // Highlight current cell
        const [mouseX, mouseY] = untrasform([$mouse.value.x, $mouse.value.y])
        const [cellX, cellY] = [Math.floor(mouseX / GRID_SIZE + 0.5), Math.floor(mouseY / GRID_SIZE + 0.5)]

        if (
            !$grid.value.has(cellX, cellY) &&
            Math.sqrt((cellX * GRID_SIZE - mouseX) ** 2 + (cellY * GRID_SIZE - mouseY) ** 2) < GRID_SIZE / 2
        ) {
            const RADIUS = GRID_SIZE * 0.25

            const [lastX, lastY] = $arrowStartCell.value ?? [NaN, NaN]

            g.fillStyle = lastX === cellX && lastY === cellY ? '#0004' : '#0002'
            g.beginPath()
            g.arc(cellX * GRID_SIZE, cellY * GRID_SIZE, RADIUS, 0, 2 * Math.PI)
            g.fill()
        }

        // Axes
        g.strokeStyle = '#666'
        g.lineWidth = 1.5
        drawLatexArrow(g, [-0.5 * GRID_SIZE, -0.5 * GRID_SIZE], [3.5 * GRID_SIZE, -0.5 * GRID_SIZE])
        drawLatexArrow(g, [-0.5 * GRID_SIZE, -0.5 * GRID_SIZE], [-0.5 * GRID_SIZE, 3.5 * GRID_SIZE])

        // Spectral sequence default arrows
        renderArrows(g, GRID_SIZE, $grid.value, $optionPageIndex.value, [cellX, cellY])

        // Extra arrows
        for (const [[startCellX, startCellY], [endCellX, endCellY]] of $extraArrows.value) {
            const [x1, y1] = [startCellX * GRID_SIZE, startCellY * GRID_SIZE]
            const [x2, y2] = [endCellX * GRID_SIZE, endCellY * GRID_SIZE]

            g.strokeStyle = '#66d'

            g.lineWidth = 1.5
            drawLatexArrow(g, [x1, y1], [x2, y2], { contractEnds: 0.35 * GRID_SIZE })
        }

        // Connect arrow
        if ($mouse.value.buttons === 1 && $arrowStartCell.value) {
            const [lastX, lastY] = $arrowStartCell.value
            const [x1, y1] = [lastX * GRID_SIZE, lastY * GRID_SIZE]
            const [x2, y2] = [mouseX, mouseY]

            g.strokeStyle = '#000'
            g.lineWidth = 1.5
            drawLatexArrow(g, [x1, y1], [x2, y2], { contractEnds: 0.15 * GRID_SIZE })
        }

        // console.timeEnd('render')
    }, [
        $pan.value,
        $optionPageIndex.value,
        $gridRefresh.value,
        $mouse.value,
        $arrowStartCell.value,
        $extraArrows.value,
    ])

    // HACK: force re-render
    console.log($gridRefresh.value)

    return (
        <div class="canvas" style={{ '--pan-x': $pan.value.x, '--pan-y': $pan.value.y }}>
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
                {Array.from($grid.value).map(([[x, y], $cell]) => (
                    <Cell x={x} y={y} $cell={$cell} />
                ))}
            </div>
        </div>
    )
}

const App = () => {
    const $optionsOpen = useSignal(true)

    const $gridRefresh = useSignal(0)
    const $grid = useSignal(new InfiniteGrid<GridCell>())

    // @ts-ignore
    window.$grid = $grid

    const $extraArrows = useSignal<[Point, Point][]>([])

    useEffect(() => {
        $gridRefresh.value += 1
    }, [$optionsOpen.value])

    useEffect(() => {
        $grid.value.set(0, 0, signal({ editing: false, value: 'E_1^{0,0}' }))
        $grid.value.set(1, 0, signal({ editing: false, value: 'E_1^{1,0}' }))
        $grid.value.set(0, 1, signal({ editing: false, value: 'E_1^{0,1}' }))
        $grid.value.set(2, 2, signal({ editing: false, value: 'E_1^{2,2}' }))
        $grid.value.set(-3, 2, signal({ editing: false, value: 'E_1^{-3,2}' }))

        $gridRefresh.value += 1

        window.addEventListener('resize', () => {
            $gridRefresh.value += 1
        })
    }, [])

    const $optionPageIndex = useSignal(0)
    const $optionShowAxes = useSignal(true)
    const $optionShowPageArrows = useSignal(true)

    return (
        <main>
            <div class={clsx('options', 'stack-v', $optionsOpen.value && 'open')}>
                <section>
                    <h1>Spectral Sequence Editor</h1>
                    <h2>
                        by <a href="https://aziis98.com">@aziis98</a>
                    </h2>
                </section>
                <hr />
                <p>
                    To create a new cell, double click on an empty dot. To edit a cell, double click on it. To connect
                    two cells with an arrow, drag from one cell to another while holding <kbd>Shift</kbd>.
                </p>
                <hr />
                <h3>Options</h3>
                <div class="option">
                    <h4>Sequence Page</h4>
                    <div class="row">
                        <button class="square" onClick={() => ($optionPageIndex.value -= 1)}>
                            <div class="icon">remove</div>
                        </button>
                        <input
                            id="sequence-page"
                            type="number"
                            class="fill"
                            value={$optionPageIndex.value}
                            onInput={e => ($optionPageIndex.value = e.currentTarget.valueAsNumber)}
                        />
                        <button class="square" onClick={() => ($optionPageIndex.value += 1)}>
                            <div class="icon">add</div>
                        </button>
                    </div>
                </div>
                <div class="option">
                    <h4>Toggles</h4>
                    <div class="row">
                        <input
                            type="checkbox"
                            id="option-show-axes"
                            checked={$optionShowAxes.value}
                            onInput={e => ($optionShowAxes.value = e.currentTarget.checked)}
                        />
                        <label for="option-show-axes">Axes</label>
                    </div>
                    <div class="row">
                        <input
                            type="checkbox"
                            id="option-show-page-arrows"
                            checked={$optionShowPageArrows.value}
                            onInput={e => ($optionShowPageArrows.value = e.currentTarget.checked)}
                        />
                        <label for="option-show-page-arrows">Page Arrows</label>
                    </div>
                </div>
                <hr />
                <div class="option">
                    <h3>Extra Arrows</h3>
                    <p>
                        To add an arrow, drag from a cell to another cell while holding <kbd>Shift</kbd>.
                    </p>
                    {$extraArrows.value.map(([[startCellX, startCellY], [endCellX, endCellY]]) => (
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
                        <button id="sequence-clear-extra-arrows-btn" onClick={() => ($extraArrows.value = [])}>
                            <div class="icon">delete</div>
                            Clear Arrows
                        </button>
                    </div>
                </div>
                <hr />
                <div class="option">
                    <h3>Actions</h3>
                    <div class="row">
                        <button id="sequence-clear-btn">
                            <div class="icon">delete</div>
                            Clear Canvas
                        </button>
                        <button id="sequence-export-btn">
                            <div class="icon">exit_to_app</div>
                            Export <em>tikzcd</em>
                        </button>
                    </div>
                </div>
                <hr />
            </div>
            <div class="options-side-buttons">
                <button class="square" onClick={() => ($optionsOpen.value = !$optionsOpen.value)}>
                    <div class="icon">{$optionsOpen.value ? 'chevron_left' : 'chevron_right'}</div>
                </button>
            </div>
            <Canvas
                $grid={$grid}
                $gridRefresh={$gridRefresh}
                $optionPageIndex={$optionPageIndex}
                $extraArrows={$extraArrows}
            />
        </main>
    )
}

render(<App />, document.body)
