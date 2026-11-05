import { useEffect, useState, useRef } from "react"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { type Restaurant } from "../../core/hooks"

const WHEEL_CONFIG = {
    radius: 180,
    center: 180,
    spinDuration: 4000,
    spinCount: { min: 3, max: 5 },
} as const

type SelectionMode = "random" | "manual"

type WheelState = {
    readonly rotation: number
    readonly spinStart: number | null
    readonly selected: Restaurant | null
    readonly selectionMode: SelectionMode
    readonly targetCount: number
    readonly selectedIds: ReadonlyArray<string>
    readonly filterClosedToday: boolean
    readonly restaurants: ReadonlyArray<Restaurant>
    readonly displaySegments: ReadonlyArray<Restaurant>
}

type WheelActions = {
    readonly spin: () => void
    readonly setSelectionMode: (mode: SelectionMode) => void
    readonly setTargetCount: (count: number) => void
    readonly toggleRestaurantSelection: (id: string) => void
    readonly clearSelected: () => void
    readonly toggleFilterClosedToday: () => void
    readonly setSelected: (id: string | null) => void
    readonly setRestaurants: (restaurants: ReadonlyArray<Restaurant>) => void
}

type WheelStore = WheelState & WheelActions

function computeSegments(state: WheelState): ReadonlyArray<Restaurant> {
    const r = state.restaurants
    const totalCount = r.length
    const validTarget = Math.min(state.targetCount, totalCount)

    if (state.selectionMode === "manual") {
        return r.filter((r) => state.selectedIds.includes(r._id))
    }
    if (validTarget < 1) {
        return []
    }
    const shuffled = [...r].toSorted(() => Math.random() - 0.5)
    return shuffled.slice(0, validTarget)
}

function restaurantsFingerprint(r: ReadonlyArray<Restaurant>): string {
    if (r.length === 0) {
        return "empty"
    }
    return `${r.length}:${String(r[0]!._id)}:${String(r[r.length - 1]!._id)}`
}

function createWheelStore(restaurants: ReadonlyArray<Restaurant>) {
    const totalCount = restaurants.length
    const validTarget = Math.min(4, totalCount)
    const initial: ReadonlyArray<Restaurant> =
        validTarget < 1 ? [] : [...restaurants].toSorted(() => Math.random() - 0.5).slice(0, validTarget)

    return create<WheelStore>()(
        immer((set, get) => ({
            rotation: 0,
            spinStart: null,
            selected: null,
            selectionMode: "random",
            targetCount: 4,
            selectedIds: [],
            filterClosedToday: false,
            restaurants: [...restaurants],
            displaySegments: initial,

            spin: () => {
                const state = get()
                if (state.spinStart !== null) {
                    return
                }

                const segments = computeSegments(state)
                if (state.filterClosedToday) {
                    const today = new Date().getDay()
                    const filtered = segments.filter(
                        (r) => !r.openingHours?.periods || r.openingHours.periods.some((p) => p.day === today),
                    )
                    if (filtered.length === 0) {
                        return
                    }
                } else if (segments.length === 0) {
                    return
                }

                const spins =
                    WHEEL_CONFIG.spinCount.min +
                    Math.random() * (WHEEL_CONFIG.spinCount.max - WHEEL_CONFIG.spinCount.min)
                const randomAngle = Math.random() * 360
                const totalRotation = Math.round(spins) * 360 + randomAngle

                set({
                    displaySegments: segments,
                    selected: null,
                    spinStart: Date.now(),
                    rotation: state.rotation + totalRotation,
                })
            },

            setSelectionMode: (mode) => {
                const current = get()
                const nextSelectedIds = mode === "random" ? [] : [...current.selectedIds]
                const nextSegments = computeSegments({
                    ...current,
                    selectionMode: mode,
                    selectedIds: nextSelectedIds,
                })
                set({
                    selectionMode: mode,
                    selectedIds: nextSelectedIds,
                    selected: null,
                    spinStart: null,
                    displaySegments: nextSegments,
                })
            },

            setTargetCount: (count) => {
                const current = get()
                const nextSelectedIds =
                    current.selectedIds.length > count ? current.selectedIds.slice(0, count) : [...current.selectedIds]
                const nextSegments = computeSegments({
                    ...current,
                    targetCount: count,
                    selectedIds: nextSelectedIds,
                })
                set({
                    targetCount: count,
                    selectedIds: nextSelectedIds,
                    selected: null,
                    spinStart: null,
                    displaySegments: nextSegments,
                })
            },

            toggleRestaurantSelection: (id) => {
                const current = get()
                const idx = current.selectedIds.indexOf(id)
                let nextSelectedIds: string[]
                if (idx > -1) {
                    nextSelectedIds = current.selectedIds.filter((_, i) => i !== idx)
                } else if (current.selectedIds.length < current.targetCount) {
                    nextSelectedIds = [...current.selectedIds, id]
                } else {
                    nextSelectedIds = [...current.selectedIds]
                }
                const nextSegments = computeSegments({ ...current, selectedIds: nextSelectedIds })
                set({
                    selectedIds: nextSelectedIds,
                    selected: null,
                    spinStart: null,
                    displaySegments: nextSegments,
                })
            },

            clearSelected: () => {
                set({ selected: null })
            },

            toggleFilterClosedToday: () => {
                const current = get()
                set({ filterClosedToday: !current.filterClosedToday })
            },

            setSelected: (id: string | null) => {
                const current = get()
                const nextSelected =
                    id !== null && id !== "" ? (current.restaurants.find((r) => r._id === id) ?? null) : null
                set({ selected: nextSelected })
            },

            setRestaurants: (incoming: ReadonlyArray<Restaurant>) => {
                const current = get()
                const prev = restaurantsFingerprint(current.restaurants)
                const nextRestaurants = [...incoming]
                const next = restaurantsFingerprint(nextRestaurants)
                if (prev !== next) {
                    const nextSegments = computeSegments({ ...current, restaurants: nextRestaurants })
                    set({ restaurants: nextRestaurants, displaySegments: nextSegments })
                } else {
                    set({ restaurants: nextRestaurants })
                }
            },
        })),
    )
}

function useElapsed(active: boolean, start: number | null) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!active) {
            setElapsed(0)
            return () => {}
        }
        let raf: number
        const tick = () => {
            setElapsed(start === null ? 0 : Math.max(0, Date.now() - start))
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(raf)
        }
    }, [active, start])

    return elapsed
}

export function useWheelStore(restaurants: ReadonlyArray<Restaurant>) {
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
    const displaySegments = store((s) => s.displaySegments)

    const totalCount = restaurants.length
    const validTargetCount = Math.min(targetCount, totalCount)

    const hasEnoughRestaurants = totalCount >= 1

    const isOpenToday = (r: Restaurant) => {
        if (!r.openingHours?.periods) {
            return true
        }
        const today = new Date().getDay()
        return r.openingHours.periods.some((p) => p.day === today)
    }

    const segments = filterClosedToday ? displaySegments.filter(isOpenToday) : displaySegments

    const canSpin =
        hasEnoughRestaurants &&
        (selectionMode === "manual"
            ? selectedIds.length >= 1 && selectedIds.length <= validTargetCount
            : validTargetCount >= 1)

    const segmentCount = segments.length
    const hasSegments = segmentCount > 0
    const isSpinning = spinStart !== null
    const elapsed = useElapsed(isSpinning, spinStart)
    const spinProgress = Math.min(elapsed / WHEEL_CONFIG.spinDuration, 1)
    const segmentAngle = hasSegments ? 360 / segmentCount : 0

    const selectedIdx = segmentAngle > 0 ? Math.floor(((((270 - rotation) % 360) + 360) % 360) / segmentAngle) : -1
    const computedSelected = selectedIdx >= 0 ? (segments[selectedIdx] ?? null) : null

    useEffect(() => {
        if (!isSpinning || spinProgress < 1) {
            return
        }
        store.getState().setSelected(computedSelected?._id ?? null)
        store.setState({ spinStart: null })
    }, [spinProgress, isSpinning, computedSelected, store])

    const availableCountOptions = Array.from({ length: totalCount }, (_, i) => i + 1)

    return {
        rotation,
        selected,
        segments,
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
