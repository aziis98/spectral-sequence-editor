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

import { Grid } from './grid'

type GenTikzOptions = Partial<typeof GEN_TIKZ_OPTIONS>

const GEN_TIKZ_OPTIONS = {
    minimumWidthEx: 5,
    minimumHeightEx: 5,
    columnSepEx: 1,
    rowSepEx: 1,

    showArrows: true,
    showDiffentials: true,
    showAxes: true,
}

const line = (s: string) => s + '\n'

export function generateTikz(grid: Grid<string>, options: GenTikzOptions = {}): string {
    options = { ...GEN_TIKZ_OPTIONS, ...options }

    let tikzSource = ''

    tikzSource += line(String.raw`\begin{tikzpicture}`)
    tikzSource += line(String.raw`    % ...`)
    tikzSource += line(String.raw`\end{tikzpicture}`)

    return tikzSource
}
