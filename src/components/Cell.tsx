import clsx from 'clsx'

import { Katex } from '@/components/Katex'
import { Coord2i } from '@/math'
import { useState } from 'preact/hooks'

const EditingCell = ({
    initialContent,
    done,
    cancel,
}: {
    initialContent: string
    done: (content: string) => void
    cancel: () => void
}) => {
    const [temporaryContent, setTemporaryContent] = useState(initialContent)

    return (
        <input
            type="text"
            value={temporaryContent}
            ref={el => el?.focus()}
            onInput={e => setTemporaryContent(e.currentTarget.value)}
            onKeyDown={e => {
                if (e.key === 'Enter') {
                    done(temporaryContent)
                }
                if (e.key === 'Escape') {
                    cancel()
                }
            }}
            onBlur={e => done(temporaryContent)}
        />
    )
}

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
                <EditingCell
                    initialContent={content}
                    done={newContent => {
                        setContent(newContent)
                        setEditing(false)
                    }}
                    cancel={() => setEditing(false)}
                />
            ) : (
                <Katex value={content} />
            )}
        </div>
    )
}
