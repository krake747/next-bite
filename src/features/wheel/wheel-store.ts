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
    filterClosedToday: boolean
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
        filterClosedToday: false,
    })

    const totalCount = createMemo(() => restaurants().length)

    const validTargetCount = createMemo(() => {
        const target = state.targetCount
        const total = totalCount()
        return Math.min(target, total)
    })

    const availableCountOptions = createMemo(() => {
        const total = totalCount()
        const options: number[] = []
        for (let i = 1; i <= total; i++) {
            options.push(i)
        }
        return options
    })

    const hasEnoughRestaurants = createMemo(() => totalCount() >= 1)

    const lockedSegments = createMemo((): Restaurant[] => {
        const all = restaurants()

        if (state.selectionMode === "manual") {
            // In manual mode, use the actually selected restaurants
            const selected = all.filter((r) => state.selectedIds.includes(r._id))
            if (selected.length >= 1) {
                return selected
            }
            return []
        }

        // Random mode: pick up to target count
        const count = validTargetCount()
        if (count < 1) return []
        const shuffled = [...all].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    })

    const isOpenToday = (restaurant: Restaurant) => {
        if (!restaurant.openingHours?.periods) return true
        const today = new Date().getDay()
        return restaurant.openingHours.periods.some((p) => p.day === today)
    }

    const filteredSegments = createMemo((): Restaurant[] => {
        const segments = lockedSegments()
        if (!state.filterClosedToday) return segments
        return segments.filter(isOpenToday)
    })

    const canSpin = createMemo(() => {
        if (!hasEnoughRestaurants()) return false
        if (state.selectionMode === "manual") {
            // In manual mode, allow spin if at least 1 restaurant is selected (up to target)
            const selectedCount = state.selectedIds.length
            return selectedCount >= 1 && selectedCount <= validTargetCount()
        }
        // Random mode: always can spin if there are restaurants
        return validTargetCount() >= 1
    })

    const segmentCount = createMemo(() => filteredSegments().length)
    const hasSegments = createMemo(() => segmentCount() > 0)

    const isSpinning = createMemo(() => state.spinStart !== null)
    const elapsed = useElapsed(isSpinning, () => state.spinStart)

    const spinProgress = createMemo(() => Math.min(elapsed() / spinDuration, 1))
    const segmentAngle = createMemo(() => (hasSegments() ? 360 / segmentCount() : 0))

    const computedSelected = createMemo(() => {
        if (!spinProgress()) return null

        const normalize = (deg: number) => ((deg % 360) + 360) % 360
        const idx = Math.floor(normalize(270 - state.rotation) / segmentAngle())
        return filteredSegments()[idx] ?? null
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
                // Clear selected restaurants when switching to random mode
                if (mode === "random") {
                    s.selectedIds = []
                }
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

    const clearSelected = () => {
        setState(
            produce((s) => {
                s.selected = null
            }),
        )
    }

    const toggleFilterClosedToday = () => {
        setState(
            produce((s) => {
                s.filterClosedToday = !s.filterClosedToday
            }),
        )
    }

    return {
        rotation: createMemo(() => state.rotation),
        selected: createMemo(() => state.selected),
        segments: filteredSegments,
        allSegments: lockedSegments,
        isSpinning,
        selectionMode: createMemo(() => state.selectionMode),
        targetCount: validTargetCount,
        selectedIds: createMemo(() => state.selectedIds),
        filterClosedToday: createMemo(() => state.filterClosedToday),
        totalCount,
        availableCountOptions,
        hasEnoughRestaurants,
        canSpin,
        spin,
        setSelectionMode,
        setTargetCount,
        toggleRestaurantSelection,
        clearSelected,
        toggleFilterClosedToday,
    }
}

export const WHEEL_CONFIG_CONSTANTS = WHEEL_CONFIG
