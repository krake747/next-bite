import { useEffect, useRef, useState } from "react"

const ZOOM_STEP = 0.5
const MIN_ZOOM = 0.5
const DEFAULT_ZOOM = 1
const MAX_ZOOM = 4
const PAN_THRESHOLD = 5

type PanState = { x: number; y: number }

export function useZoomPan(resetToken: number) {
    const [zoom, setZoom] = useState(DEFAULT_ZOOM)
    const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
    const [rotation, setRotation] = useState(0)
    const [seenToken, setSeenToken] = useState(resetToken)

    // Render-time adjustment: reset zoom state when the viewed image changes.
    if (resetToken !== seenToken) {
        setSeenToken(resetToken)
        setZoom(DEFAULT_ZOOM)
        setPan({ x: 0, y: 0 })
        setRotation(0)
    }

    const [isPanning, setIsPanning] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const initialPinchDistance = useRef<number | undefined>(undefined)
    const initialPinchZoom = useRef<number | undefined>(undefined)
    const startPan = useRef({ x: 0, y: 0 })
    const suppressClickAfterPanRef = useRef(false)
    const lastPointerRef = useRef<PanState | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) {
            return () => {}
        }

        const onPointerDown = (e: PointerEvent) => {
            if (zoom <= DEFAULT_ZOOM) {
                return
            }
            e.preventDefault()
            container.setPointerCapture(e.pointerId)
            lastPointerRef.current = { x: e.clientX, y: e.clientY }
            startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
            setIsPanning(true)
        }

        const onPointerMove = (e: PointerEvent) => {
            const lastPointer = lastPointerRef.current
            if (!lastPointer) {
                return
            }
            const dx = Math.abs(e.clientX - lastPointer.x)
            const dy = Math.abs(e.clientY - lastPointer.y)
            if (dx > PAN_THRESHOLD || dy > PAN_THRESHOLD) {
                suppressClickAfterPanRef.current = true
            }
            setPan({ x: e.clientX - startPan.current.x, y: e.clientY - startPan.current.y })
        }

        const onPointerUp = () => {
            lastPointerRef.current = null
            setIsPanning(false)
            queueMicrotask(() => {
                suppressClickAfterPanRef.current = false
            })
        }

        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)

        return () => {
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
        }
    }, [zoom, pan.x, pan.y])

    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) {
            return 0
        }
        const touch0 = touches[0]
        const touch1 = touches[1]
        if (!touch0 || !touch1) {
            return 0
        }
        const dx = touch0.clientX - touch1.clientX
        const dy = touch0.clientY - touch1.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const resetZoom = () => {
        setZoom(DEFAULT_ZOOM)
        setPan({ x: 0, y: 0 })
        setRotation(0)
    }

    const zoomIn = () => {
        setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))
    }

    const zoomOut = () => {
        if (zoom - ZOOM_STEP <= MIN_ZOOM) {
            setPan({ x: 0, y: 0 })
        }
        setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))
    }

    const rotate = () => {
        setRotation((r) => (r + 90) % 360)
    }

    const clickZoom = () => {
        if (suppressClickAfterPanRef.current) {
            suppressClickAfterPanRef.current = false
            return
        }
        if (zoom > DEFAULT_ZOOM) {
            resetZoom()
        } else {
            setZoom(2)
        }
    }

    const wheelZoom = (e: React.WheelEvent) => {
        e.preventDefault()
        if (e.deltaY < 0) {
            zoomIn()
        } else {
            zoomOut()
        }
    }

    const touchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            initialPinchDistance.current = getTouchDistance(e.touches)
            initialPinchZoom.current = zoom
        }
    }

    const touchMove = (e: React.TouchEvent) => {
        if (
            e.touches.length === 2 &&
            initialPinchDistance.current !== undefined &&
            initialPinchDistance.current !== 0 &&
            initialPinchZoom.current !== undefined &&
            initialPinchZoom.current !== 0
        ) {
            e.preventDefault()
            const currentDistance = getTouchDistance(e.touches)
            const scale = currentDistance / initialPinchDistance.current
            const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchZoom.current * scale))
            setZoom(next)
            if (next <= DEFAULT_ZOOM) {
                setPan({ x: 0, y: 0 })
            }
        }
    }

    const touchEnd = () => {
        initialPinchDistance.current = undefined
        initialPinchZoom.current = undefined
    }

    return {
        zoom,
        pan,
        rotation,
        isPanning,
        containerRef,
        resetZoom,
        zoomIn,
        zoomOut,
        rotate,
        clickZoom,
        wheelZoom,
        touchStart,
        touchMove,
        touchEnd,
    }
}
