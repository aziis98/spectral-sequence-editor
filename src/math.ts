export type Coord2i = { x: number; y: number }

export type SpectralSequenceCoord = { r: number; p: number; q: number }

export const elemAlongChain = (t: number, { r, p, q }: SpectralSequenceCoord) => [p + t * r, q + t * (1 - r)]

export const inRange = (min: number, value: number, max: number) => min <= value && value <= max
