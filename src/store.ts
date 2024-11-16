import { Grid } from './grid'
import { Coord2i } from './math'

export type Arrow = [Coord2i, Coord2i]

export type EditorOptions = {
    r: number
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
    options: EditorOptions
}
