import { Grid } from '@/grid'
import { Arrow, EditorOptions } from '@/store'
import { SpectralSequenceIndex as SpectralSequenceCoord, Coord2i } from './math'

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

export function renderArrows<T>(
    g: CanvasRenderingContext2D,
    cellSize: number,

    grid: Grid<T>,
    r: number,

    /**
     * Used to highlight the currently hovered chain.
     */
    activeChain: Coord2i | null
) {
    for (let p = -10; p <= 10; p++) {
        for (let q = -10; q <= 10; q++) {
            if (grid.has(p, q) || grid.has(p + r, q - r + 1)) {
                // E_r^{p, q} -> E_r^{p + r, q - r + 1}
                const [x1, y1] = [p * cellSize, q * cellSize]
                const [x2, y2] = [(p + r) * cellSize, (q - r + 1) * cellSize]

                if (activeChain) {
                    const currentChainIndex = diagonalIndex({ r, p, q })

                    const { x: pActive, y: qActive } = activeChain
                    const activeChainIndex = diagonalIndex({ r, p: pActive, q: qActive })

                    g.strokeStyle = currentChainIndex === activeChainIndex ? '#333' : '#999'
                } else {
                    g.strokeStyle = '#999'
                }

                g.lineWidth = 1.5
                drawLatexArrow(g, { x: x1, y: y1 }, { x: x2, y: y2 }, { contractEnds: 0.35 * cellSize })
            }
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

        mouse,
        connectArrowStartCell,

        r,

        showDotGrid,
        showAxes,
        showDifferentials,
        showExtraArrows,
    }: {
        grid: Grid<string>
        extraArrows: Arrow[]

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
    const { x: mouseX, y: mouseY } = untrasform(mouse)
    const { x: mouseCellX, y: mouseCellY } = {
        x: Math.floor(mouseX / gridSize + 0.5),
        y: Math.floor(mouseY / gridSize + 0.5),
    }

    if (
        !panning &&
        !grid.has(mouseCellX, mouseCellY) &&
        Math.sqrt((mouseCellX * gridSize - mouseX) ** 2 + (mouseCellY * gridSize - mouseY) ** 2) < gridSize / 2
    ) {
        const RADIUS = gridSize * 0.25

        g.fillStyle = '#0002'
        g.beginPath()
        g.arc(mouseCellX * gridSize, mouseCellY * gridSize, RADIUS, 0, 2 * Math.PI)
        g.fill()
    }

    // Axes
    if (showAxes) {
        g.strokeStyle = '#333'
        g.lineWidth = 1 * window.devicePixelRatio
        drawLatexArrow(g, { x: -0.5 * gridSize, y: -0.5 * gridSize }, { x: 3.5 * gridSize, y: -0.5 * gridSize })
        drawLatexArrow(g, { x: -0.5 * gridSize, y: -0.5 * gridSize }, { x: -0.5 * gridSize, y: 3.5 * gridSize })
    }

    // Spectral sequence default arrows
    if (showDifferentials) {
        renderArrows(g, gridSize, grid, r, { x: mouseCellX, y: mouseCellY })
    }

    // Extra arrows
    for (const [{ x: startCellX, y: startCellY }, { x: endCellX, y: endCellY }] of extraArrows) {
        const [x1, y1] = [startCellX * gridSize, startCellY * gridSize]
        const [x2, y2] = [endCellX * gridSize, endCellY * gridSize]

        g.strokeStyle = '#66d'

        g.lineWidth = 1 * window.devicePixelRatio
        drawLatexArrow(g, { x: x1, y: y1 }, { x: x2, y: y2 }, { contractEnds: 0.35 * gridSize })
    }

    // Connect arrow
    if (mouse.buttons === 1 && connectArrowStartCell) {
        const { x: connectStartX, y: connectStartY } = connectArrowStartCell

        g.strokeStyle = '#000'
        g.lineWidth = 1 * window.devicePixelRatio
        drawLatexArrow(
            g,
            {
                x: connectStartX * gridSize,
                y: connectStartY * gridSize,
            },
            {
                x: mouseCellX * gridSize,
                y: mouseCellY * gridSize,
            },
            { contractEnds: 0.15 * gridSize }
        )
    }
}
