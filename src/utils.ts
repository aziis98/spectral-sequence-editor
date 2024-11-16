// export const measureUnitValue = (value: string) => {
//     const el = document.createElement('div')
//     el.style.visibility = 'hidden'
//     el.style.width = value
//     document.body.appendChild(el)
//     const width = el.offsetWidth
//     document.body.removeChild(el)

//     console.log('measured', value, width)

//     return width
// }

export const convertRemToPixels = (remValue: number) => {
    return remValue * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
