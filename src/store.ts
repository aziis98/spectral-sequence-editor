import { Grid } from './grid'
import { Coord2i } from './math'

export type Arrow = [Coord2i, Coord2i]

export type EditorOptions = {
    showOptions: boolean
    showDotGrid: boolean
    showAxes: boolean
    showDifferentials: boolean
    showExtraArrows: boolean
}

export type Store = {
    grid: Grid<string>
    extraArrows: Arrow[]
    editing: Coord2i | null

    mode: 'homological' | 'cohomological'
    r: number

    options: EditorOptions
}
