import { describe, expect, it } from 'bun:test'
import { generateTikz } from './tikz'
import { InfiniteGrid } from './grid'

describe('TikZ', () => {
    it('should generate TikZ code', () => {
        const grid = new InfiniteGrid<string>()
        grid.set(-1, -1, 'E_1^{-1,-1}')
        grid.set(0, 0, 'E_1^{0,0}')
        grid.set(1, 0, 'E_1^{1,0}')
        grid.set(0, 1, 'E_1^{0,1}')
        grid.set(2, 2, 'E_1^{2,2}')

        const source = generateTikz(
            grid,
            [
                [
                    { x: 0, y: 0 },
                    { x: 2, y: 1 },
                ],
            ],
            {
                r: 0,
                showDotGrid: true,
                showAxes: true,
                showDifferentials: true,
                showExtraArrows: true,
            },
        )

        console.log(source)
    })
})
