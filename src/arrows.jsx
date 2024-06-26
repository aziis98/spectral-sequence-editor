import { createEffect, createSignal } from 'solid-js'

const convertRemToPixels = remValue => {
    return remValue * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

const CELL_SIZE = convertRemToPixels(6)

function drawLatexArrow(g, [x1, y1], [x2, y2], { contractEnds } = {}) {
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

function renderArrows(g, grid, pan, r, hoveredCellIndex) {
    const diagonalIndex = (r, p, q) => r * q - p * (1 - r)

    for (let p = -10; p <= 10; p++) {
        for (let q = -10; q <= 10; q++) {
            if (
                (grid[`${r} ${p} ${q}`] && grid[`${r} ${p} ${q}`].value() !== '') ||
                (grid[`${r} ${p + r} ${q - r + 1}`] && grid[`${r} ${p + r} ${q - r + 1}`].value() !== '')
            ) {
                // E_r^{p, q} -> E_r^{p + r, q - r + 1}
                const [x1, y1] = [p * CELL_SIZE, q * CELL_SIZE]
                const [x2, y2] = [(p + r) * CELL_SIZE, (q - r + 1) * CELL_SIZE]

                if (hoveredCellIndex) {
                    const [_hovR, hovP, hovQ] = hoveredCellIndex
                    const hovDiagonalIndex = diagonalIndex(r, hovP, hovQ)

                    g.strokeStyle = diagonalIndex(r, p, q) === hovDiagonalIndex ? '#333' : '#999'
                } else {
                    g.strokeStyle = '#999'
                }

                g.lineWidth = 1.5
                drawLatexArrow(g, [x1, y1], [x2, y2], { contractEnds: 0.35 * CELL_SIZE })
            }
        }
    }
}

/**
 * A canvas that renders the arrows and axes of the current page of the spectral sequence.
 */
export const BackgroundCanvas = ({ grid, pan, currentPage, hoveredCell }) => {
    const [ref, setRef] = createSignal(null)
    let g

    createEffect(() => {
        const $canvas = ref()
        if (!$canvas) return

        if (!g) {
            $canvas.width = $canvas.offsetWidth
            $canvas.height = $canvas.offsetHeight
            g = $canvas.getContext('2d')
        }

        g.resetTransform()
        g.clearRect(0, 0, $canvas.width, $canvas.height)

        g.translate(g.canvas.width / 2, g.canvas.height / 2)
        g.translate(pan().x, pan().y)
        g.scale(1, -1)

        g.lineCap = 'round'
        g.lineJoin = 'round'

        // Axes
        {
            g.strokeStyle = '#666'
            g.lineWidth = 1.5

            drawLatexArrow(g, [-0.5 * CELL_SIZE, -0.5 * CELL_SIZE], [3.5 * CELL_SIZE, -0.5 * CELL_SIZE])
            drawLatexArrow(g, [-0.5 * CELL_SIZE, -0.5 * CELL_SIZE], [-0.5 * CELL_SIZE, 3.5 * CELL_SIZE])
        }

        // Page Arrows
        renderArrows(g, grid(), pan(), currentPage(), hoveredCell())
    })

    return <canvas ref={setRef}></canvas>
}
