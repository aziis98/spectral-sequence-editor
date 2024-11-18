// export const measureUnitValue = (value: string) => {
//     const el = document.createElement('div')
//     el.style.visibility = 'hidden'
//     el.style.width = value
//     document.body.appendChild(el)
//     const width = el.offsetWidth
//     document.body.removeChild(el)

import { StateUpdater } from 'preact/hooks'

//     console.log('measured', value, width)

//     return width
// }

export const convertRemToPixels = (remValue: number) => {
    return remValue * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const applyUpdater = <T>(updater: StateUpdater<T>, previous: T) =>
    typeof updater === 'function' ? (updater as (prev: T) => T)(previous) : updater
