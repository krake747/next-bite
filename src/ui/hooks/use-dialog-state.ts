import { useState, useCallback } from "react"

export function useDialogState(initial = false) {
    const [show, setShow] = useState(initial)

    const open = useCallback(() => setShow(true), [])
    const close = useCallback(() => setShow(false), [])
    const toggle = useCallback(() => setShow((prev) => !prev), [])

    return {
        show,
        setShow,
        open,
        close,
        toggle,
    }
}
