import { createSignal } from "solid-js"

export function useDialogState(initial = false) {
    const [show, setShow] = createSignal(initial)

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
