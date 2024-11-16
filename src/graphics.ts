import { Grid } from './grid'

export type Point = [number, number]

type DrawLatexArrowOptions = {
    contractEnds?: number
}

export function drawLatexArrow(
    g: CanvasRenderingContext2D,
    [x1, y1]: Point,
    [x2, y2]: Point,
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
const diagonalIndex = (r: number, p: number, q: number) => r * q - p * (1 - r)

export function renderArrows<T>(
    g: CanvasRenderingContext2D,
    cellSize: number,

    grid: Grid<T>,
    r: number,

    /**
     * Used to highlight the currently hovered chain.
     */
    activeChain: [number, number] | null
) {
    for (let p = -10; p <= 10; p++) {
        for (let q = -10; q <= 10; q++) {
            if (grid.has(p, q) || grid.has(p + r, q - r + 1)) {
                // E_r^{p, q} -> E_r^{p + r, q - r + 1}
                const [x1, y1] = [p * cellSize, q * cellSize]
                const [x2, y2] = [(p + r) * cellSize, (q - r + 1) * cellSize]

                if (activeChain) {
                    const currentChainIndex = diagonalIndex(r, p, q)

                    const [pActive, qActive] = activeChain
                    const activeChainIndex = diagonalIndex(r, pActive, qActive)

                    g.strokeStyle = currentChainIndex === activeChainIndex ? '#333' : '#999'
                } else {
                    g.strokeStyle = '#999'
                }

                g.lineWidth = 1.5
                drawLatexArrow(g, [x1, y1], [x2, y2], { contractEnds: 0.35 * cellSize })
            }
        }
    }
}
