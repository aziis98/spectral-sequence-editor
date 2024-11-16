//@ts-ignore
import 'katex/dist/katex.min.css'

import katex from 'katex'

type Props = {
    value: string
}

export const Katex = ({ value }: Props) => {
    return (
        <div
            class="katex-content"
            ref={el => {
                if (!el) return

                katex.render(value, el, {
                    throwOnError: false,
                    displayMode: true,
                })
            }}
        />
    )
}
