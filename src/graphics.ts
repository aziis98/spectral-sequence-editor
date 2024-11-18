import { Grid } from '@/grid'
import { Arrow, EditorOptions } from '@/store'
import { SpectralSequenceCoord, Coord2i, elemAlongChain, Coord2 } from './math'

type DrawLatexArrowOptions = {
    contractEnds?: number
}

export function drawLatexArrow(
    g: CanvasRenderingContext2D,
    { x: x1, y: y1 }: Coord2i,
    { x: x2, y: y2 }: Coord2i,
    { contractEnds }: DrawLatexArrowOptions = {}
) {
    if (contractEnds !== undefined) {
        // contract the ends of the arrow
        const dx = x2 - x1
        const dy = y2 - y1

        if (typeof contractEnds === 'number') {
            const length = Math.sqrt(dx ** 2 + dy ** 2)
            const ratio = contractEnds / length
            x1 += dx * ratio
            y1 += dy * ratio
            x2 -= dx * ratio
            y2 -= dy * ratio
        } else {
            x1 += dx * 0.15
            y1 += dy * 0.15
            x2 -= dx * 0.15
            y2 -= dy * 0.15
        }
    }

    const angle = Math.atan2(y2 - y1, x2 - x1)

    const headLength = 10
    const headWidth = 10

    const arrowLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    g.save()
    {
        g.translate(x1, y1)
        g.rotate(angle)

        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(arrowLength, 0)

        g.moveTo(arrowLength, 0)
        g.quadraticCurveTo(arrowLength - headLength * 0.65, 0, arrowLength - headLength, headWidth)
        g.moveTo(arrowLength, 0)
        g.quadraticCurveTo(arrowLength - headLength * 0.65, 0, arrowLength - headLength, -headWidth)
        g.stroke()
    }
    g.restore()
}

/**
 * Returns the index of the chain relative to the element at $E_r^{p, q}$.
 */
const diagonalIndex = ({ r, p, q }: SpectralSequenceCoord) => r * q - p * (1 - r)

const isActiveChain = (activeChain: SpectralSequenceCoord | null, { r, p, q }: SpectralSequenceCoord) =>
    activeChain && diagonalIndex({ r, p, q }) === diagonalIndex(activeChain)

export function renderArrows<T>(
    g: CanvasRenderingContext2D,
    cellSize: number,

    grid: Grid<T>,
    r: number,
    mode: 'homological' | 'cohomological',

    /**
     * Used to highlight the currently hovered chain.
     */
    activeChain: Coord2i | null
) {
    for (const [[p, q]] of grid) {
        const [prevX, prevY] = elemAlongChain(-1, { r, p, q })
        const [currX, currY] = [p, q]
        const [nextX, nextY] = elemAlongChain(+1, { r, p, q })

        const [[x1, y1], [x2, y2], [x3, y3]] =
            mode === 'homological'
                ? [
                      [nextX, nextY],
                      [currX, currY],
                      [prevX, prevY],
                  ]
                : [
                      [prevX, prevY],
                      [currX, currY],
                      [nextX, nextY],
                  ]

        g.strokeStyle = isActiveChain(activeChain ? { r, p: activeChain.x, q: activeChain.y } : null, {
            r,
            p,
            q,
        })
            ? '#333'
            : '#999'

        g.lineWidth = 1.5 * window.devicePixelRatio

        if (mode === 'homological' || !grid.has(x1, y1)) {
            drawLatexArrow(
                g,
                { x: x1 * cellSize, y: y1 * cellSize },
                { x: x2 * cellSize, y: y2 * cellSize },
                { contractEnds: 0.35 * cellSize }
            )
        }

        if (mode === 'cohomological' || !grid.has(x3, y3)) {
            drawLatexArrow(
                g,
                { x: x2 * cellSize, y: y2 * cellSize },
                { x: x3 * cellSize, y: y3 * cellSize },
                { contractEnds: 0.35 * cellSize }
            )
        }
    }
}

export function drawCanvas(
    g: CanvasRenderingContext2D,
    {
        grid,
        extraArrows,

        gridSize,

        pan,
        panning,

        mouse: viewportMouse,
        connectArrowStartCell,

        r,
        mode,

        showDotGrid,
        showAxes,
        showDifferentials,
        showExtraArrows,
    }: {
        grid: Grid<string>
        extraArrows: Arrow[]

        r: number
        mode: 'homological' | 'cohomological'

        gridSize: number

        pan: Coord2i
        panning: boolean

        mouse: Coord2i & { buttons: number }
        connectArrowStartCell: Coord2i | null
    } & EditorOptions
) {
    const untrasform = ({ x, y }: Coord2i) => {
        return {
            x: x - g.canvas.width / window.devicePixelRatio / 2 - pan.x,
            y: g.canvas.height / window.devicePixelRatio / 2 - y + pan.y,
        }
    }

    g.reset()
    g.resetTransform()
    g.clearRect(0, 0, g.canvas.width, g.canvas.height)

    g.lineCap = 'round'
    g.lineJoin = 'round'

    g.scale(window.devicePixelRatio, window.devicePixelRatio)

    g.translate(g.canvas.width / window.devicePixelRatio / 2, g.canvas.height / window.devicePixelRatio / 2)
    g.translate(pan.x, pan.y)
    g.scale(1, -1)

    // Dot grid
    if (showDotGrid) {
        g.fillStyle = '#ccc'
        g.lineWidth = 1 * window.devicePixelRatio

        const viewportCenterX = -(pan.x / gridSize) | 0
        const viewportCenterY = (pan.y / gridSize) | 0

        const RADIUS = 10

        for (let i = viewportCenterX - RADIUS; i <= viewportCenterX + RADIUS; i++) {
            for (let j = viewportCenterY - RADIUS; j <= viewportCenterY + RADIUS; j++) {
                g.beginPath()
                g.arc(i * gridSize, j * gridSize, 2, 0, 2 * Math.PI)
                g.fill()
            }
        }
    }

    // Highlight current cell
    const mouse = untrasform(viewportMouse)
    const { x: mouseX, y: mouseY } = mouse
    const mouseCell = {
        x: Math.floor(mouseX / gridSize + 0.5),
        y: Math.floor(mouseY / gridSize + 0.5),
    }

    const { x: mouseCellX, y: mouseCellY } = mouseCell

    if (
        !panning &&
        !grid.has(mouseCellX, mouseCellY) &&
        Coord2.dist(Coord2.mul(mouseCell, gridSize), mouse) < gridSize / 2
    ) {
        const RADIUS = gridSize * 0.25

        const { x, y } = Coord2.mul(mouseCell, gridSize)

        g.fillStyle = '#0002'
        g.beginPath()
        g.arc(x, y, RADIUS, 0, 2 * Math.PI)
        g.fill()
    }

    // Axes
    if (showAxes) {
        g.strokeStyle = '#333'
        g.lineWidth = 1 * window.devicePixelRatio
        drawLatexArrow(
            g,
            { x: -0.5 * gridSize, y: -0.5 * gridSize },
            { x: 3.5 * gridSize, y: -0.5 * gridSize }
        )
        drawLatexArrow(
            g,
            { x: -0.5 * gridSize, y: -0.5 * gridSize },
            { x: -0.5 * gridSize, y: 3.5 * gridSize }
        )
    }

    // Spectral sequence default arrows
    if (showDifferentials) {
        renderArrows(g, gridSize, grid, r, mode, mouseCell)
    }

    // Extra arrows
    if (showExtraArrows) {
        for (const [startCell, endCell] of extraArrows) {
            g.strokeStyle = '#66d'
            g.lineWidth = 1.5 * window.devicePixelRatio

            drawLatexArrow(g, Coord2.mul(startCell, gridSize), Coord2.mul(endCell, gridSize), {
                contractEnds: 0.35 * gridSize,
            })
        }
    }

    // Connect arrow
    if (viewportMouse.buttons === 1 && connectArrowStartCell) {
        g.strokeStyle = '#000'
        g.lineWidth = 1 * window.devicePixelRatio

        drawLatexArrow(g, Coord2.mul(connectArrowStartCell, gridSize), Coord2.mul(mouseCell, gridSize), {
            contractEnds: 0.15 * gridSize,
        })
    }
}
