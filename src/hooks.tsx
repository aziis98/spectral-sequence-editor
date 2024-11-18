import { computed, useSignal } from '@preact/signals'
import { RefObject } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Coord2i } from './math'

type PannableState = null | {
    panStartPos: { x: number; y: number }
    dragStartPos: { x: number; y: number }
}

export const useMouse = (): [
    {
        x: number
        y: number
        buttons: number
        shiftKey: boolean
    },
    RefObject<HTMLElement>,
] => {
    const [mouse, setMouse] = useState({
        x: 0,
        y: 0,
        buttons: 0,
        shiftKey: false,
    })

    const elementRef = useRef<HTMLElement>(null)

    const onMouseMove = (e: MouseEvent) => {
        if (!elementRef.current) return

        const rect = elementRef.current.getBoundingClientRect()

        setMouse({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            buttons: e.buttons,
            shiftKey: e.shiftKey,
        })
    }

    useEffect(() => {
        if (!elementRef.current) return

        document.addEventListener('pointermove', onMouseMove)

        return () => {
            document?.removeEventListener('pointermove', onMouseMove)
        }
    }, [elementRef.current])

    return [mouse, elementRef] as const
}

export function useEventListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
) {
    useEffect(() => {
        // @ts-ignore
        el.addEventListener(type, listener)

        return () => {
            // @ts-ignore
            el.removeEventListener(type, listener)
        }
    }, [el, type, listener])
}

export const usePannable = <T extends HTMLElement>(): [Coord2i, RefObject<T>, boolean] => {
    const pannableRef = useRef<T>(null)

    const $pan = useSignal({ x: 0, y: 0 })
    const $state = useSignal<PannableState>(null)

    useEventListener(document, 'pointerdown', (e: PointerEvent) => {
        if (e.target !== pannableRef.current) return
        if (e.shiftKey) return

        $state.value = {
            panStartPos: $pan.value,
            dragStartPos: { x: e.clientX, y: e.clientY },
        }
    })

    useEventListener(document, 'pointermove', (e: PointerEvent) => {
        if (!$state.value) return

        $pan.value = {
            x: $state.value.panStartPos.x + (e.clientX - $state.value.dragStartPos.x),
            y: $state.value.panStartPos.y + (e.clientY - $state.value.dragStartPos.y),
        }
    })

    useEventListener(document, 'pointerup', () => {
        $state.value = null
    })

    const panning = $state.value !== null

    return [$pan.value, pannableRef, panning]
}
