import clsx from 'clsx'

import { Katex } from '@/components/Katex'
import { Coord2i } from '@/math'

export const Cell = ({
    coord: { x, y },

    editing,
    content,

    setContent,
    setEditing,
}: {
    coord: Coord2i

    editing: boolean
    content: string

    setContent: (content: string) => void
    setEditing: (editing: boolean) => void
}) => {
    return (
        <div
            class={clsx('cell', editing && 'editing')}
            style={{ '--x': x, '--y': y }}
            onDblClick={() => setEditing(true)}
        >
            {editing ? (
                <input
                    type="text"
                    value={content}
                    ref={el => el?.focus()}
                    onKeyDown={e => {
                        console.log(e.key)
                        if (e.key === 'Enter') {
                            setEditing(false)
                            setContent(e.currentTarget.value)
                        }
                        if (e.key === 'Escape') {
                            setEditing(false)
                        }
                    }}
                    onBlur={e => {
                        setEditing(false)
                        setContent(e.currentTarget.value)
                    }}
                />
            ) : (
                <Katex value={content} />
            )}
        </div>
    )
}
