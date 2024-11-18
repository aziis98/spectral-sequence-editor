export type Coord2i = { x: number; y: number }

export type SpectralSequenceCoord = { r: number; p: number; q: number }

export const elemAlongChain = (t: number, { r, p, q }: SpectralSequenceCoord) => [p + t * r, q + t * (1 - r)]

export const inRange = (min: number, value: number, max: number) => min <= value && value <= max

export const Coord2 = {
    add: (a: Coord2i, b: Coord2i): Coord2i => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a: Coord2i, b: Coord2i): Coord2i => ({ x: a.x - b.x, y: a.y - b.y }),
    mul: (a: Coord2i, scalar: number): Coord2i => ({ x: a.x * scalar, y: a.y * scalar }),
    div: (a: Coord2i, scalar: number): Coord2i => ({ x: a.x / scalar, y: a.y / scalar }),

    dist(a: Coord2i, b: Coord2i) {
        const dx = a.x - b.x
        const dy = a.y - b.y
        return Math.sqrt(dx * dx + dy * dy)
    },
}
