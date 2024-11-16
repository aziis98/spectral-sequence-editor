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
    options = { ...GEN_TIKZ_OPTIONS, ...options }

    const gridCells = [...grid]
    const pMin = Math.min(0, ...gridCells.map(([[p, _]]) => p))
    const pMax = Math.max(...gridCells.map(([[p, _]]) => p))
    const qMin = Math.min(0, ...gridCells.map(([[_, q]]) => q))
    const qMax = Math.max(...gridCells.map(([[_, q]]) => q))

    const pRange = pMax - pMin + 1
    const qRange = qMax - qMin + 1

    const originCell: [number, number] = [-pMin, -qMin]

    const mapPQtoCell = ([p, q]: [number, number]): [number, number] => [p - pMin + 1, qRange - q - qMin - 1]

    const tikzMatrix = Array.from({ length: qRange + 1 }, () => Array.from({ length: pRange + 1 }, () => ''))

    for (const [[p, q], value] of gridCells) {
        const [x, y] = mapPQtoCell([p, q])
        tikzMatrix[y][x] = value
    }

    console.log(tikzMatrix)

    let tikzSource = ''

    tikzSource += line(String.raw`\begin{tikzpicture}`)
    tikzSource += line(String.raw`\matrix (m) [`)
    tikzSource += line(String.raw`matrix of math nodes,`)
    tikzSource += line(String.raw`nodes in empty cells,`)

    const minWidthEx = options.minimumWidthEx
    const minHeightEx = options.minimumHeightEx

    tikzSource += line(String.raw`nodes={minimum width=${minWidthEx}ex, minimum height=${minHeightEx}ex},`)
    tikzSource += line(String.raw`column sep=${options.columnSepEx}ex,`)
    tikzSource += line(String.raw`row sep=${options.rowSepEx}ex`)
    tikzSource += line(String.raw`] {`)

    for (const row of tikzMatrix) {
        tikzSource += line(String.raw`${row.join(' & ')} \\`)
    }

    tikzSource += line(String.raw`};`)

    // Arrows
    tikzSource += line()
    tikzSource += line(String.raw`% Arrows`)
    for (const [{ x: startP, y: startQ }, { x: endP, y: endQ }] of extraArrows) {
        tikzSource += line(
            String.raw`\draw[->] (m-${mapPQtoCell([startP, startQ]).join('-')}) -- (m-${mapPQtoCell([endP, endQ]).join(
                '-'
            )});`
        )
    }

    const [oX, oY] = mapPQtoCell(originCell)

    // Axes
    tikzSource += line()
    tikzSource += line(String.raw`% Axes`)
    tikzSource += line(String.raw`\draw[thick] (m-${qRange + 1}-1.north east) -- (m-1-1.north east);`)
    tikzSource += line(
        String.raw`\draw[thick] (m-${qRange + 1}-1.north east) -- (m-${qRange + 1}-${pRange + 1}.north east);`
    )

    tikzSource += line(String.raw`\end{tikzpicture}`)

    return tikzSource
}
