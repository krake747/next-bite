import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { useEffect, useState, useRef, useCallback } from "react"
import { type Restaurant } from "../../core/hooks"

const WHEEL_CONFIG = {
    radius: 180,
    center: 180,
    spinDuration: 4000,
    spinCount: { min: 3, max: 5 },
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

type WheelActions = {
    spin: () => void
    setSelectionMode: (mode: SelectionMode) => void
    setTargetCount: (count: number) => void
    toggleRestaurantSelection: (id: string) => void
    clearSelected: () => void
    toggleFilterClosedToday: () => void
    setSelected: (id: string | null) => void
    setRestaurants: (restaurants: Restaurant[]) => void
}

type WheelStore = WheelState & WheelActions & { restaurants: Restaurant[] }

function createWheelStore(restaurants: Restaurant[]) {
    return create<WheelStore>()(
        immer((set, get) => ({
            rotation: 0,
            spinStart: null,
            selected: null,
            selectionMode: "random",
            targetCount: 4,
            selectedIds: [],
            filterClosedToday: false,
            restaurants,

            spin: () => {
                const state = get()
                if (state.spinStart !== null) return

                const r = state.restaurants
                const totalCount = r.length
                const validTarget = Math.min(state.targetCount, totalCount)

                const getSegments = () => {
                    if (state.selectionMode === "manual") {
                        const selected = r.filter((r) => state.selectedIds.includes(r._id))
                        return selected.length >= 1 ? selected : []
                    }
                    if (validTarget < 1) return []
                    const shuffled = [...r].sort(() => Math.random() - 0.5)
                    return shuffled.slice(0, validTarget)
                }

                const getFilteredSegments = () => {
                    const segments = getSegments()
                    if (!state.filterClosedToday) return segments
                    const today = new Date().getDay()
                    return segments.filter(
                        (r) => !r.openingHours?.periods || r.openingHours.periods.some((p) => p.day === today),
                    )
                }

                const filtered = getFilteredSegments()
                if (filtered.length === 0) return

                const spins =
                    WHEEL_CONFIG.spinCount.min +
                    Math.random() * (WHEEL_CONFIG.spinCount.max - WHEEL_CONFIG.spinCount.min)
                const randomAngle = Math.random() * 360
                const totalRotation = Math.round(spins) * 360 + randomAngle

                set((s) => {
                    s.selected = null
                    s.spinStart = Date.now()
                    s.rotation += totalRotation
                })
            },

            setSelectionMode: (mode) =>
                set((s) => {
                    s.selectionMode = mode
                    if (mode === "random") s.selectedIds = []
                    s.selected = null
                    s.spinStart = null
                }),

            setTargetCount: (count) =>
                set((s) => {
                    s.targetCount = count
                    if (s.selectedIds.length > count) s.selectedIds = s.selectedIds.slice(0, count)
                    s.selected = null
                    s.spinStart = null
                }),

            toggleRestaurantSelection: (id) =>
                set((s) => {
                    const idx = s.selectedIds.indexOf(id)
                    if (idx > -1) {
                        s.selectedIds.splice(idx, 1)
                    } else if (s.selectedIds.length < s.targetCount) {
                        s.selectedIds.push(id)
                    }
                    s.selected = null
                    s.spinStart = null
                }),

            clearSelected: () =>
                set((s) => {
                    s.selected = null
                }),

            toggleFilterClosedToday: () =>
                set((s) => {
                    s.filterClosedToday = !s.filterClosedToday
                }),

            setSelected: (id: string | null) =>
                set((s) => {
                    s.selected = id ? (s.restaurants.find((r) => r._id === id) ?? null) : null
                }),

            setRestaurants: (restaurants: Restaurant[]) =>
                set((s) => {
                    s.restaurants = restaurants
                }),
        })),
    )
}

function useElapsed(active: boolean, start: number | null) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!active) {
            setElapsed(0)
            return
        }
        let raf: number
        const tick = () => {
            setElapsed(start === null ? 0 : Math.max(0, Date.now() - start))
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [active, start])

    return elapsed
}

export function useWheelStore(restaurants: Restaurant[]) {
    const storeRef = useRef(createWheelStore(restaurants))
    const store = storeRef.current

    useEffect(() => {
        store.getState().setRestaurants(restaurants)
    }, [restaurants, store])

    const rotation = store((s) => s.rotation)
    const spinStart = store((s) => s.spinStart)
    const selected = store((s) => s.selected)
    const selectionMode = store((s) => s.selectionMode)
    const targetCount = store((s) => s.targetCount)
    const selectedIds = store((s) => s.selectedIds)
    const filterClosedToday = store((s) => s.filterClosedToday)

    const totalCount = restaurants.length
    const validTargetCount = Math.min(targetCount, totalCount)

    const hasEnoughRestaurants = totalCount >= 1

    const allSegments = useCallback((): Restaurant[] => {
        if (selectionMode === "manual") {
            const selected = restaurants.filter((r) => selectedIds.includes(r._id))
            if (selected.length >= 1) return selected
            return []
        }
        if (validTargetCount < 1) return []
        const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, validTargetCount)
    }, [restaurants, selectionMode, selectedIds, validTargetCount])()

    const isOpenToday = (r: Restaurant) => {
        if (!r.openingHours?.periods) return true
        const today = new Date().getDay()
        return r.openingHours.periods.some((p) => p.day === today)
    }

    const segments = filterClosedToday ? allSegments.filter(isOpenToday) : allSegments

    const canSpin = useCallback(() => {
        if (!hasEnoughRestaurants) return false
        if (selectionMode === "manual") return selectedIds.length >= 1 && selectedIds.length <= validTargetCount
        return validTargetCount >= 1
    }, [hasEnoughRestaurants, selectionMode, selectedIds.length, validTargetCount])()

    const segmentCount = segments.length
    const hasSegments = segmentCount > 0
    const isSpinning = spinStart !== null
    const elapsed = useElapsed(isSpinning, spinStart)
    const spinProgress = Math.min(elapsed / WHEEL_CONFIG.spinDuration, 1)
    const segmentAngle = hasSegments ? 360 / segmentCount : 0

    const computedSelected = useCallback(() => {
        if (!spinProgress) return null
        const normalize = (deg: number) => ((deg % 360) + 360) % 360
        const idx = Math.floor(normalize(270 - rotation) / segmentAngle)
        return segments[idx] ?? null
    }, [spinProgress, rotation, segmentAngle, segments])()

    useEffect(() => {
        if (!isSpinning || spinProgress < 1) return
        if (spinProgress >= 1) {
            const cs = computedSelected
            store.getState().setSelected(cs?._id ?? null)
            store.setState({ spinStart: null })
        }
    }, [spinProgress, isSpinning, computedSelected, store])

    const availableCountOptions = Array.from({ length: totalCount }, (_, i) => i + 1)

    return {
        rotation,
        selected,
        segments,
        allSegments,
        isSpinning,
        selectionMode,
        targetCount: validTargetCount,
        selectedIds,
        filterClosedToday,
        totalCount,
        availableCountOptions,
        hasEnoughRestaurants,
        canSpin,
        spin: store.getState().spin,
        setSelectionMode: store.getState().setSelectionMode,
        setTargetCount: store.getState().setTargetCount,
        toggleRestaurantSelection: store.getState().toggleRestaurantSelection,
        clearSelected: store.getState().clearSelected,
        toggleFilterClosedToday: store.getState().toggleFilterClosedToday,
    }
}

export const WHEEL_CONFIG_CONSTANTS = WHEEL_CONFIG
