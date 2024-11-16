import { describe, expect, it } from 'bun:test'

import { InfiniteGrid } from './grid'

describe('InfiniteGrid', () => {
    it('should store and retrieve values', () => {
        const grid = new InfiniteGrid<number>()

        grid.set(0, 0, 42)
        expect(grid.get(0, 0)).toBe(42)
    })

    it('should iterate over stored values', () => {
        const grid = new InfiniteGrid<number>()

        grid.set(0, 0, 42)
        grid.set(1, 1, 43)

        const entries = Array.from(grid)
        expect(entries).toEqual([
            [[0, 0], 42],
            [[1, 1], 43],
        ])
    })

    it('has method should return true for stored values', () => {
        const grid = new InfiniteGrid<number>()

        grid.set(0, 0, 42)
        grid.set(1, 1, 12)

        expect(grid.has(0, 0)).toBe(true)
        expect(grid.has(1, 1)).toBe(true)
        expect(grid.has(2, 2)).toBe(false)
    })

    it('should store and retrieve multiple values (including negative)', () => {
        const grid = new InfiniteGrid<string>()

        grid.set(0, 0, 'origin')
        grid.set(1, 1, 'diagonal')
        grid.set(-2, 3, 'negative')
        grid.set(4, -5, 'other negative')
        grid.set(-6, -7, 'both negative')

        expect(grid.get(0, 0)).toBe('origin')
        expect(grid.get(1, 1)).toBe('diagonal')
        expect(grid.get(-2, 3)).toBe('negative')
        expect(grid.get(4, -5)).toBe('other negative')
        expect(grid.get(-6, -7)).toBe('both negative')

        const entries = Array.from(grid)
        expect(entries).toEqual([
            [[0, 0], 'origin'],
            [[1, 1], 'diagonal'],
            [[-2, 3], 'negative'],
            [[4, -5], 'other negative'],
            [[-6, -7], 'both negative'],
        ])
    })
})
