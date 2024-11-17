/*
Prototype TikZ code:

\begin{tikzpicture}
    \matrix (m) [
        matrix of math nodes,
        nodes in empty cells,
        nodes={minimum width=5ex, minimum height=5ex},
        column sep=1ex,
        row sep=1ex
    ]{
        & & & & \\
        & E_2^{0,2} & & & \\
        & 0 & 0 & 0 & \\
        & x & & E_2^{2,0} \\
        & & & & \\
    };
    
    % Arrows
    \draw[->] (m-2-2) -- (m-3-4);
    \draw[->] (m-3-2) -- (m-4-4);

    % Axes
    \draw[thick] (m-5-1.north east) -- (m-1-1.south east) ;
    \draw[thick] (m-5-1.north east) -- (m-5-5.north west) ;
\end{tikzpicture}
*/

import { Grid } from '@/grid'
import { Arrow } from '@/store'

type GenTikzOptions = Partial<typeof GEN_TIKZ_OPTIONS>

const GEN_TIKZ_OPTIONS = {
    r: 0,
    mode: 'homological' as 'homological' | 'cohomological',

    showDotGrid: true,
    showAxes: true,
    showDifferentials: true,
    showExtraArrows: true,

    minimumWidthEx: 5,
    minimumHeightEx: 5,
    columnSepEx: 1,
    rowSepEx: 1,
}

const line = (s: string = '') => s + '\n'

export function generateTikz(grid: Grid<string>, extraArrows: Arrow[], options: GenTikzOptions = {}): string {
    const opts = { ...GEN_TIKZ_OPTIONS, ...options }

    const gridCells = [...grid]
    const pMin = Math.min(0, ...gridCells.map(([[p, _]]) => p))
    const pMax = Math.max(...gridCells.map(([[p, _]]) => p))
    const qMin = Math.min(0, ...gridCells.map(([[_, q]]) => q)) - 1
    const qMax = Math.max(...gridCells.map(([[_, q]]) => q))

    const pRange = pMax - pMin + 1
    const qRange = qMax - qMin + 1

    const mapPQtoCell = ([p, q]: [number, number]): [number, number] => [
        //
        qRange - (q - qMin) + 1,
        p - pMin + 1,
    ]

    const tikzMatrix = Array.from({ length: qRange + 1 }, () =>
        Array.from({ length: pRange + 1 }, () => String.raw`\vphantom{.}`)
    )

    for (const [[p, q], value] of gridCells) {
        const [i, j] = mapPQtoCell([p, q])
        console.log(p, q, value, '->', i, j)
        tikzMatrix[i - 1][j - 1] = value
    }

    let tikzSource = ''

    tikzSource += line(String.raw`\begin{tikzpicture}`)
    tikzSource += line(String.raw`\matrix (m) [`)
    tikzSource += line(String.raw`matrix of math nodes,`)
    tikzSource += line(String.raw`nodes in empty cells,`)

    const minWidthEx = opts.minimumWidthEx
    const minHeightEx = opts.minimumHeightEx

    tikzSource += line(
        String.raw`nodes={minimum width=${minWidthEx}ex, minimum height=${minHeightEx}ex, anchor=center},`
    )
    tikzSource += line(String.raw`column sep=${opts.columnSepEx}ex,`)
    tikzSource += line(String.raw`row sep=${opts.rowSepEx}ex`)
    tikzSource += line(String.raw`] {`)

    for (const row of tikzMatrix) {
        tikzSource += line(String.raw`${row.join(' & ')} \\`)
    }

    tikzSource += line(String.raw`};`)

    // Differentials
    // for (const [[p, q]] of grid) {
    //     const [prevX, prevY] = [p + r, q - r + 1]
    //     const [currX, currY] = [p, q]
    //     const [nextX, nextY] = [p - r, q + r - 1]

    //     const [[x1, y1], [x2, y2], [x3, y3]] =
    //         mode === 'homological'
    //             ? [
    //                   [prevX, prevY],
    //                   [currX, currY],
    //                   [nextX, nextY],
    //               ]
    //             : [
    //                   [nextX, nextY],
    //                   [currX, currY],
    //                   [prevX, prevY],
    //               ]

    //     g.strokeStyle = isActiveChain(activeChain ? { r, p: activeChain.x, q: activeChain.y } : null, { r, p, q })
    //         ? '#333'
    //         : '#999'

    //     g.lineWidth = 1.5

    //     drawLatexArrow(
    //         g,
    //         { x: x1 * cellSize, y: y1 * cellSize },
    //         { x: x2 * cellSize, y: y2 * cellSize },
    //         { contractEnds: 0.35 * cellSize }
    //     )

    //     if (!grid.has(nextX, nextY)) {
    //         drawLatexArrow(
    //             g,
    //             { x: x2 * cellSize, y: y2 * cellSize },
    //             { x: x3 * cellSize, y: y3 * cellSize },
    //             { contractEnds: 0.35 * cellSize }
    //         )
    //     }
    // }

    tikzSource += line()
    tikzSource += line(String.raw`% Differentials`)
    for (const [[p, q]] of grid) {
        const [prevX, prevY] = [p + opts.r, q - opts.r + 1]
        const [currX, currY] = [p, q]
        const [nextX, nextY] = [p - opts.r, q + opts.r - 1]

        const [[x1, y1], [x2, y2], [x3, y3]] =
            opts.mode === 'homological'
                ? [
                      [prevX, prevY],
                      [currX, currY],
                      [nextX, nextY],
                  ]
                : [
                      [nextX, nextY],
                      [currX, currY],
                      [prevX, prevY],
                  ]

        tikzSource += line(
            String.raw`\draw[->] (m-${mapPQtoCell([x1, y1]).join('-')}) -- (m-${mapPQtoCell([x2, y2]).join('-')});`
        )

        if (!grid.has(nextX, nextY)) {
            tikzSource += line(
                String.raw`\draw[->] (m-${mapPQtoCell([x2, y2]).join('-')}) -- (m-${mapPQtoCell([x3, y3]).join('-')});`
            )
        }
    }

    // Extra Arrows
    tikzSource += line()
    tikzSource += line(String.raw`% Arrows`)
    for (const [{ x: startP, y: startQ }, { x: endP, y: endQ }] of extraArrows) {
        tikzSource += line(
            String.raw`\draw[->] (m-${mapPQtoCell([startP, startQ]).join('-')}) -- (m-${mapPQtoCell([endP, endQ]).join(
                '-'
            )});`
        )
    }

    const [oX, oY] = mapPQtoCell([0, 0])
    console.log('origin', '->', [oX, oY])

    // Axes
    tikzSource += line()
    tikzSource += line(String.raw`% Axes`)

    tikzSource += line(
        String.raw`\draw[thick] ([xshift=-1ex,yshift=-1ex]m-${oX}-${oY}.south west) -- ([xshift=-1ex,yshift=30ex]m-${oX}-${oY}.south west);`
    )
    tikzSource += line(
        String.raw`\draw[thick] ([xshift=-1ex,yshift=-1ex]m-${oX}-${oY}.south west) -- ([xshift=30ex,yshift=-1ex]m-${oX}-${oY}.south west);`
    )

    tikzSource += line(String.raw`\end{tikzpicture}`)

    return tikzSource
}
