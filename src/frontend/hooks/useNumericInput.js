import { useEffect, useState } from 'react'

/** Handler hook for a commit-on-Enter/blur numeric input: keeps a local draft synced with the external value, clamps to [min, max] on commit, and treats an empty draft as null. */
export default function useNumericInput({ value, min, max, onCommit }) {
    const [draft, setDraft] = useState(value == null ? '' : String(value))

    // External value changes (slider drag, chart click, reset) refresh the draft.
    useEffect(() => {
        setDraft(value == null ? '' : String(value))
    }, [value])

    const handleChange = (event) => {
        // Digits only; partial input stays local until committed.
        setDraft(event.target.value.replace(/[^0-9]/g, ''))
    }

    const commitDraft = () => {
        if (draft === '') {
            onCommit(null)
            return
        }
        const parsed = Number(draft)
        if (!Number.isFinite(parsed)) {
            setDraft(value == null ? '' : String(value))
            return
        }
        const clamped = Math.min(Math.max(parsed, min), max)
        setDraft(String(clamped))
        onCommit(clamped)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur() // blur triggers the commit
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            setDraft(value == null ? '' : String(value))
            event.currentTarget.blur()
        }
    }

    return { draft, handleChange, commitDraft, handleKeyDown }
}
