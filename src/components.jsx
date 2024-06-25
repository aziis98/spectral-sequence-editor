import { createEffect, onCleanup, onMount } from 'solid-js'

import 'katex/dist/katex.min.css'
import katex from 'katex'

export const MathText = ({ value }) => {
    const mountMath = $el => {
        if (!$el) return

        createEffect(() => {
            katex.render(value(), $el, {
                throwOnError: false,
                displayMode: true,
            })
        })
    }

    return <div class="math-text" ref={mountMath}></div>
}
