/**
 * Directive for making an element pannable
 */
export const pannable = (el, options = () => {}) => {
    let initialX,
        initialY,
        isDown = false

    const { onDown, onMove, onUp } = options()

    const handleDown = e => {
        // if (e.target !== el) return

        isDown = true
        initialX = e.clientX
        initialY = e.clientY

        // console.log('[Pannable] onDown:', initialX, initialY)
        onDown?.(initialX, initialY)
    }

    const handleMove = e => {
        if (!isDown) return
        const dx = e.clientX - initialX
        const dy = e.clientY - initialY

        // console.log('[Pannable] onMove:', dx, dy)
        onMove?.(dx, dy)
    }

    const handleUp = e => {
        const dx = e.clientX - initialX
        const dy = e.clientY - initialY
        isDown = false

        // console.log('[Pannable] onUp:', dx, dy)
        onUp?.(dx, dy)
    }

    el.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)

    return () => {
        el.removeEventListener('pointerdown', handleDown)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
    }
}
