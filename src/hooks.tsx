import { computed, useSignal } from '@preact/signals'
import { useEffect, useRef } from 'preact/hooks'

type MouseState = null | {
    panStartPos: { x: number; y: number }
    dragStartPos: { x: number; y: number }
}

export const useMouse = () => {
    const $mouse = useSignal({
        x: 0,
        y: 0,
        buttons: 0,
        shiftKey: false,
    })
    const elementRef = useRef<HTMLElement>(null)

    const onMouseMove = (e: MouseEvent) => {
        if (!elementRef.current) return

        const rect = elementRef.current.getBoundingClientRect()

        $mouse.value = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            buttons: e.buttons,
            shiftKey: e.shiftKey,
        }
    }

    useEffect(() => {
        if (!elementRef.current) return

        document.addEventListener('pointermove', onMouseMove)

        return () => {
            document?.removeEventListener('pointermove', onMouseMove)
        }
    }, [elementRef.current])

    return [$mouse, elementRef] as const
}

export const usePannable = <T extends HTMLElement>() => {
    const pannableRef = useRef<T>(null)

    const $pan = useSignal({ x: 0, y: 0 })
    const $mouse = useSignal<MouseState>(null)

    const onPointerDown = (e: PointerEvent) => {
        console.log(e.target, pannableRef.current)

        if (e.target !== pannableRef.current) return
        if (e.shiftKey) return

        $mouse.value = {
            panStartPos: { x: $pan.value.x, y: $pan.value.y },
            dragStartPos: { x: e.clientX, y: e.clientY },
        }
    }

    const onPointerMove = (e: PointerEvent) => {
        if (!$mouse.value) return

        $pan.value = {
            x: $mouse.value.panStartPos.x + (e.clientX - $mouse.value.dragStartPos.x),
            y: $mouse.value.panStartPos.y + (e.clientY - $mouse.value.dragStartPos.y),
        }
    }

    const onPointerUp = () => {
        $mouse.value = null
    }

    useEffect(() => {
        console.log(pannableRef.current)

        if (!pannableRef.current) return

        console.log('adding event listeners')

        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)

        return () => {
            console.log('removing event listeners')

            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('pointermove', onPointerMove)
            document.removeEventListener('pointerup', onPointerUp)
        }
    }, [pannableRef.current])

    return [computed(() => $pan.value), pannableRef] as const
}
