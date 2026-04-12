import { createMemo, createSignal, createEffect, onCleanup } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { type Accessor } from "solid-js"
import { type Restaurant } from "../../core/hooks"

const WHEEL_CONFIG = {
    radius: 180,
    center: 180,
    spinDuration: 4000,
    spinCount: {
        min: 3,
        max: 5,
    },
} as const

type SelectionMode = "random" | "manual"

type WheelState = {
    rotation: number
    spinStart: number | null
    selected: Restaurant | null
    selectionMode: SelectionMode
    targetCount: number
    selectedIds: string[]
}

function useElapsed(active: Accessor<boolean>, start: Accessor<number | null>) {
    const [elapsed, setElapsed] = createSignal(0)

    createEffect(() => {
        if (!active()) return
        let raf: number

        const tick = () => {
            const s = start()
            setElapsed(s === null ? 0 : Math.max(0, Date.now() - s))
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        onCleanup(() => cancelAnimationFrame(raf))
    })

    return elapsed
}

export function useWheelStore(restaurants: Accessor<Restaurant[]>) {
    const { spinDuration, spinCount } = WHEEL_CONFIG

    const [state, setState] = createStore<WheelState>({
        rotation: 0,
        spinStart: null,
        selected: null,
        selectionMode: "random",
        targetCount: 4,
        selectedIds: [],
    })

    const totalCount = createMemo(() => restaurants().length)

    const maxEvenCount = createMemo(() => {
        const total = totalCount()
        return total % 2 === 0 ? total : total - 1
    })

    const validTargetCount = createMemo(() => {
        const target = state.targetCount
        const max = maxEvenCount()
        return Math.min(target, max)
    })

    const availableCountOptions = createMemo(() => {
        const max = maxEvenCount()
        const options: number[] = []
        for (let i = 2; i <= max; i += 2) {
            options.push(i)
        }
        return options
    })

    const hasEnoughRestaurants = createMemo(() => totalCount() >= 2)

    const canSpin = createMemo(() => {
        if (!hasEnoughRestaurants()) return false
        if (state.selectionMode === "manual") {
            return state.selectedIds.length === validTargetCount() && state.selectedIds.length >= 2
        }
        return validTargetCount() >= 2
    })

    const lockedSegments = createMemo((): Restaurant[] => {
        const all = restaurants()
        const count = validTargetCount()

        if (count < 2) return []

        if (state.selectionMode === "manual") {
            const selected = all.filter((r) => state.selectedIds.includes(r._id))
            if (selected.length >= 2) {
                return selected.slice(0, count)
            }
            return []
        }

        const shuffled = [...all].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    })

    const segmentCount = createMemo(() => lockedSegments().length)
    const hasSegments = createMemo(() => segmentCount() > 0)

    const isSpinning = createMemo(() => state.spinStart !== null)
    const elapsed = useElapsed(isSpinning, () => state.spinStart)

    const spinProgress = createMemo(() => Math.min(elapsed() / spinDuration, 1))
    const segmentAngle = createMemo(() => (hasSegments() ? 360 / segmentCount() : 0))

    const computedSelected = createMemo(() => {
        if (!spinProgress()) return null

        const normalize = (deg: number) => ((deg % 360) + 360) % 360
        const idx = Math.floor(normalize(270 - state.rotation) / segmentAngle())
        return lockedSegments()[idx] ?? null
    })

    createEffect(() => {
        if (!isSpinning() || spinProgress() < 1) return
        if (spinProgress() >= 1) {
            setState(
                produce((s) => {
                    s.selected = computedSelected()
                    s.spinStart = null
                }),
            )
        }
    })

    const spin = () => {
        if (isSpinning() || !hasSegments() || !canSpin()) return

        const spins = spinCount.min + Math.random() * (spinCount.max - spinCount.min)
        const randomAngle = Math.random() * 360
        const totalRotation = Math.round(spins) * 360 + randomAngle

        setState(
            produce((s) => {
                s.selected = null
                s.spinStart = Date.now()
                s.rotation += totalRotation
            }),
        )
    }

    const setSelectionMode = (mode: SelectionMode) => {
        setState(
            produce((s) => {
                s.selectionMode = mode
                s.selected = null
                s.spinStart = null
            }),
        )
    }

    const setTargetCount = (count: number) => {
        setState(
            produce((s) => {
                s.targetCount = count
                if (s.selectedIds.length > count) {
                    s.selectedIds = s.selectedIds.slice(0, count)
                }
                s.selected = null
                s.spinStart = null
            }),
        )
    }

    const toggleRestaurantSelection = (id: string) => {
        setState(
            produce((s) => {
                const idx = s.selectedIds.indexOf(id)
                if (idx > -1) {
                    s.selectedIds.splice(idx, 1)
                } else if (s.selectedIds.length < s.targetCount) {
                    s.selectedIds.push(id)
                }
                s.selected = null
                s.spinStart = null
            }),
        )
    }

    return {
        rotation: createMemo(() => state.rotation),
        selected: createMemo(() => state.selected),
        segments: lockedSegments,
        isSpinning,
        selectionMode: createMemo(() => state.selectionMode),
        targetCount: validTargetCount,
        selectedIds: createMemo(() => state.selectedIds),
        totalCount,
        maxEvenCount,
        availableCountOptions,
        hasEnoughRestaurants,
        canSpin,
        spin,
        setSelectionMode,
        setTargetCount,
        toggleRestaurantSelection,
    }
}

export const WHEEL_CONFIG_CONSTANTS = WHEEL_CONFIG
