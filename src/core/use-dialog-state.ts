import { useState } from "react"

export function useDialogState(initial = false) {
    const [show, setShow] = useState(initial)

    const open = () => setShow(true)
    const close = () => setShow(false)
    const toggle = () => setShow((prev) => !prev)

    return {
        show,
        setShow,
        open,
        close,
        toggle,
    }
}
