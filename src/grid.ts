// const interleave1 = (x: number, y: number) => {
//     let z = 0

//     for (let i = 0; i < 16; i++) {
//         z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1))
//     }

//     return z
// }

const interleave2 = (x: number, y: number) => {
    const mask = [0x55555555, 0x33333333, 0x0f0f0f0f, 0x00ff00ff]
    const shifts = [1, 2, 4, 8]

    x = (x | (x << shifts[3])) & mask[3]
    x = (x | (x << shifts[2])) & mask[2]
    x = (x | (x << shifts[1])) & mask[1]
    x = (x | (x << shifts[0])) & mask[0]

    y = (y | (y << shifts[3])) & mask[3]
    y = (y | (y << shifts[2])) & mask[2]
    y = (y | (y << shifts[1])) & mask[1]
    y = (y | (y << shifts[0])) & mask[0]

    return x | (y << 1)
}

const uninterleave = (z: number) => {
    z = z & 0x55555555 //               0b01010101010101010101010101010101
    z = (z | (z >> 1)) & 0x33333333 //  0b00110011001100110011001100110011
    z = (z | (z >> 2)) & 0x0f0f0f0f //  0b00001111000011110000111100001111
    z = (z | (z >> 4)) & 0x00ff00ff //  0b00000000111111110000000011111111
    z = (z | (z >> 8)) & 0x0000ffff //  0b00000000000000001111111111111111
    return z
}

const deinterleave2 = (z: number) => {
    const x = uninterleave(z)
    const y = uninterleave(z >> 1)
    return [x, y]
}

const interleave3 = (x: number, y: number): number => {
    let newX = (Math.abs(x) << 1) | (x < 0 ? 0b1 : 0b0)
    let newY = (Math.abs(y) << 1) | (y < 0 ? 0b1 : 0b0)

    return interleave2(newX, newY)
}

const deinterleave3 = (z: number) => {
    const signX = (z & 0b1) === 0b1 ? -1 : 1
    const signY = ((z >> 1) & 0b1) === 0b1 ? -1 : 1

    const [x, y] = deinterleave2(z >> 2)

    return [signX * x, signY * y] as const
}

// const x = ((2 * Math.random() - 1) * 0x0fff) | 0
// const y = ((2 * Math.random() - 1) * 0x0fff) | 0

// console.log('x           =  ', Math.abs(x).toString(2).padStart(16, '0').split('').join('   '), '    = ' + x)
// // console.log('interleave1 =', interleave1(x, y).toString(2).padStart(32, '0').split('').join(' '))
// // console.log('interleave2 =', interleave2(x, y).toString(2).padStart(32, '0').split('').join(' '))
// console.log('interleave3 =    ', interleave3(x, y).toString(2).padStart(32, '0').split('').join(' '))
// console.log('y           =', Math.abs(y).toString(2).padStart(16, '0').split('').join('   '), '      = ' + y)

export type Grid<T> = {
    has(x: number, y: number): boolean
    get(x: number, y: number): T
    set(x: number, y: number, value: T): void
}

export class InfiniteGrid<T> {
    private dict: T[]

    constructor() {
        this.dict = []
    }

    has(x: number, y: number) {
        return this.dict.hasOwnProperty(interleave3(x, y))
    }

    get(x: number, y: number) {
        return this.dict[interleave3(x, y)]
    }

    set(x: number, y: number, value: T) {
        this.dict[interleave3(x, y)] = value
    }

    inspect() {
        console.log(this.dict)
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this.dict.length; i++) {
            if (this.dict[i] !== undefined) {
                const coord = deinterleave3(i)
                yield [coord, this.dict[i]] as const
            }
        }
    }
}

// const x = ((2 * Math.random() - 1) * 0x0fff) | 0
// const y = ((2 * Math.random() - 1) * 0x0fff) | 0

// const z = interleave3(x, y)

// console.log('   x = ', Math.abs(x).toString(2).padStart(16, '0').split('').join(' '), ' =', x)
// console.log('=> z =', z.toString(2).padStart(32, '0'))
// console.log('   y =', Math.abs(y).toString(2).padStart(16, '0').split('').join(' '), ' =', y)

// console.log('deinterleave2 =', deinterleave3(z))
