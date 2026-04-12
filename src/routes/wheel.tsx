import {
    For,
    Show,
    Suspense,
    createContext,
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    useContext,
    type Accessor,
    type ComponentProps,
} from "solid-js"
import { createStore, produce } from "solid-js/store"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { useRestaurants, type Restaurant } from "../core/hooks"
import { Footer } from "../features/footer"
import { Button } from "../ui/button"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import RotateCw from "lucide-solid/icons/rotate-cw"
import { RestaurantCard } from "../features/restaurant-card"
import { cx } from "../ui/variants"
import Settings from "lucide-solid/icons/settings"
import Shuffle from "lucide-solid/icons/shuffle"
import Check from "lucide-solid/icons/check"
import AlertCircle from "lucide-solid/icons/circle-alert"

export const Route = createFileRoute("/wheel")({
    head: () => ({ meta: [{ title: "Spin the Wheel - Next Bite" }] }),
    component: WheelPage,
})

function WheelPage() {
    const navigate = useNavigate()
    const restaurants = useRestaurants()
    const safeRestaurants = () => restaurants() ?? []
    const wheel = useWheelStore(safeRestaurants)
    const [showSettings, setShowSettings] = createSignal(false)

    return (
        <WheelContext.Provider value={wheel}>
            <div class="flex min-h-screen flex-col">
                <main class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                    <Header>
                        <HeaderTitle>Spin the wheel</HeaderTitle>
                        <HeaderSubtitle>
                            Let fate decide your next bite! May the spins be ever in your favour.
                        </HeaderSubtitle>
                    </Header>
                    <div class="flex flex-col items-center space-y-4">
                        <div class="mb-4 flex gap-2">
                            <Button onClick={() => navigate({ to: "/", from: Route.fullPath })}>
                                <UtensilsCrossed class="size-4" />
                                Go back home
                            </Button>
                            <Button variant="secondary" onClick={() => setShowSettings(true)}>
                                <Settings class="size-4" />
                                Settings
                            </Button>
                        </div>
                        <Suspense fallback={<EmptyWheelState />}>
                            <Show when={showSettings()}>
                                <WheelConfigModal
                                    restaurants={safeRestaurants}
                                    onClose={() => setShowSettings(false)}
                                />
                            </Show>
                            <SpinningWheel />
                        </Suspense>
                        <Show when={wheel.selected()} fallback={<Instructions />}>
                            {(restaurant) => (
                                <>
                                    <WinnerMessage />
                                    <RestaurantCard class="animate-fade-in w-full max-w-md" restaurant={restaurant()} />
                                </>
                            )}
                        </Show>
                    </div>
                </main>
                <Footer />
            </div>
        </WheelContext.Provider>
    )
}

function EmptyWheelState() {
    return (
        <div class="flex flex-col items-center space-y-4 text-center">
            <div class="flex size-80 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                <div class="text-neutral-500 dark:text-neutral-400">
                    <UtensilsCrossed class="mx-auto mb-4 size-16 opacity-50" />
                    <p class="text-lg font-medium">No restaurants to spin</p>
                    <p class="mt-2 text-sm">Add some restaurants to get started!</p>
                </div>
            </div>
        </div>
    )
}

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

type WheelState = {
    rotation: number
    spinStart: number | null
    selected: Restaurant | null
    selectionMode: SelectionMode
    targetCount: number
    selectedIds: string[]
}

function useWheelStore(restaurants: Accessor<Restaurant[]>) {
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

const WheelContext = createContext<ReturnType<typeof useWheelStore>>()

function useWheel() {
    const ctx = useContext(WheelContext)
    if (!ctx) {
        throw new Error("useWheel must be used within a WheelContext.Provider")
    }

    return ctx
}

function WheelConfigModal(props: { restaurants: Accessor<Restaurant[]>; onClose: () => void }) {
    const wheel = useWheel()

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Settings class="size-5 text-neutral-500" />
                        <span class="font-medium text-neutral-900 dark:text-white">Wheel Settings</span>
                    </div>
                    <button
                        onClick={props.onClose}
                        class="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                        aria-label="Close settings"
                    >
                        <span class="sr-only">Close</span>
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <Show when={!wheel.hasEnoughRestaurants()}>
                        <div class="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle class="size-4" />
                            <span>Need at least 2 restaurants to spin. Add more restaurants first.</span>
                        </div>
                    </Show>

                    <Show when={wheel.hasEnoughRestaurants()}>
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Selection Mode
                            </label>
                            <div class="flex gap-2">
                                <button
                                    onClick={() => wheel.setSelectionMode("random")}
                                    class={cx(
                                        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        wheel.selectionMode() === "random"
                                            ? "bg-flame-pea-700 text-white dark:bg-flame-pea-600"
                                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600",
                                    )}
                                >
                                    <Shuffle class="size-4" />
                                    Random
                                </button>
                                <button
                                    onClick={() => wheel.setSelectionMode("manual")}
                                    class={cx(
                                        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        wheel.selectionMode() === "manual"
                                            ? "bg-flame-pea-700 text-white dark:bg-flame-pea-600"
                                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600",
                                    )}
                                >
                                    <Check class="size-4" />
                                    Manual Pick
                                </button>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Number of Restaurants
                            </label>
                            <select
                                value={wheel.targetCount()}
                                onChange={(e) => wheel.setTargetCount(parseInt(e.currentTarget.value))}
                                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            >
                                <For each={wheel.availableCountOptions()}>
                                    {(count) => <option value={count}>{count} restaurants</option>}
                                </For>
                            </select>
                            <p class="text-xs text-neutral-500">Even numbers only (2, 4, 6, etc.)</p>
                        </div>

                        <Show when={wheel.selectionMode() === "manual"}>
                            <div class="space-y-3">
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Select Restaurants
                                    <span class="ml-1 text-xs text-neutral-500">
                                        ({wheel.selectedIds().length}/{wheel.targetCount()} selected)
                                    </span>
                                </label>
                                <div class="max-h-48 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-700">
                                    <For each={props.restaurants()}>
                                        {(restaurant) => (
                                            <label class="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50">
                                                <input
                                                    type="checkbox"
                                                    checked={wheel.selectedIds().includes(restaurant._id)}
                                                    onChange={() => wheel.toggleRestaurantSelection(restaurant._id)}
                                                    disabled={
                                                        !wheel.selectedIds().includes(restaurant._id) &&
                                                        wheel.selectedIds().length >= wheel.targetCount()
                                                    }
                                                    class="size-4 rounded border-neutral-300 text-flame-pea-700 focus:ring-flame-pea-700 disabled:opacity-50 dark:border-neutral-600"
                                                />
                                                <span class="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {restaurant.name}
                                                </span>
                                            </label>
                                        )}
                                    </For>
                                </div>
                                <Show when={wheel.selectedIds().length < wheel.targetCount()}>
                                    <p class="text-xs text-amber-600 dark:text-amber-400">
                                        Please select {wheel.targetCount() - wheel.selectedIds().length} more
                                        restaurant(s)
                                    </p>
                                </Show>
                            </div>
                        </Show>

                        <Button class="w-full" onClick={props.onClose}>
                            Done
                        </Button>
                    </Show>
                </div>
            </div>
        </div>
    )
}

function SpinningWheel() {
    const wheel = useWheel()
    const { radius, spinDuration } = WHEEL_CONFIG
    const size = radius * 2

    const duration = createMemo(() => {
        return wheel.isSpinning() ? spinDuration : 500
    })

    return (
        <div class="relative flex items-center justify-center overflow-clip bg-transparent">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                class="rounded-full"
                style={{
                    transform: `rotate(${wheel.rotation()}deg)`,
                    transition: wheel.isSpinning()
                        ? `transform ${duration()}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                        : "transform 500ms",
                }}
            >
                <For each={wheel.segments()}>
                    {(restaurant, idx) => <WheelSegment restaurant={restaurant} idx={idx()} />}
                </For>
            </svg>
            <WheelNeedle />
            <SpinWheelButton class="absolute" />
        </div>
    )
}

function WheelSegment(props: { restaurant: Restaurant; idx: number }) {
    const wheel = useWheel()
    const { radius, center } = WHEEL_CONFIG

    const segment = createMemo(() => {
        const point = (angle: number, factor = 1) => [
            center + radius * factor * Math.cos(angle),
            center + radius * factor * Math.sin(angle),
        ]

        const segmentCount = wheel.segments().length
        const segmentAngle = segmentCount > 0 ? 360 / segmentCount : 0
        const start = (props.idx * segmentAngle * Math.PI) / 180
        const end = ((props.idx + 1) * segmentAngle * Math.PI) / 180
        const arc = segmentAngle > 180 ? 1 : 0
        const [x1, y1] = point(start)
        const [x2, y2] = point(end)
        const labelAngle = start + (end - start) / 2

        const [x, y] = point(labelAngle, 0.6)

        const rotationDeg = ((labelAngle * 180) / Math.PI + 360) % 360
        const rotation = rotationDeg > 180 ? rotationDeg - 180 : rotationDeg

        return {
            path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${arc} 1 ${x2} ${y2} Z`,
            x,
            y,
            rotation,
        }
    })

    return (
        <>
            <path
                d={segment().path}
                class={props.idx % 2 === 0 ? "fill-flame-pea-700 dark:fill-flame-pea-600" : "fill-neutral-600"}
            />
            <text
                x={segment().x}
                y={segment().y}
                class={cx("text-xs", props.idx % 2 === 0 ? "fill-white dark:fill-neutral-900" : "fill-white")}
                text-anchor="middle"
                dominant-baseline="middle"
                transform={`rotate(${segment().rotation}, ${segment().x}, ${segment().y})`}
            >
                {props.restaurant.name}
            </text>
        </>
    )
}

function SpinWheelButton(props: ComponentProps<"button">) {
    const wheel = useWheel()
    const { spinDuration } = WHEEL_CONFIG

    const duration = createMemo(() => {
        return wheel.isSpinning() ? spinDuration : 500
    })

    return (
        <Button
            onClick={wheel.spin}
            disabled={wheel.isSpinning() || !wheel.canSpin()}
            class={cx("size-18 rounded-full bg-neutral-50", props.class)}
            variant="secondary"
            aria-label="Spin the wheel"
        >
            <RotateCw
                class="size-6"
                style={{
                    transform: `rotate(${wheel.rotation()}deg)`,
                    transition: wheel.isSpinning()
                        ? `transform ${duration()}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                        : "transform 500ms",
                }}
            />
        </Button>
    )
}

function Instructions() {
    return (
        <p class="max-w-md text-center text-neutral-600 dark:text-neutral-400">
            Give the wheel a whirl and let fate (or your stomach) decide which restaurant wins today.
        </p>
    )
}

function WinnerMessage() {
    return (
        <div class="animate-fade-in text-center">
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Winner!</h2>
        </div>
    )
}

function WheelNeedle() {
    return (
        <div class="absolute top-0 -translate-y-2 rotate-180">
            <div class="size-0 border-r-10 border-b-30 border-l-10 border-r-transparent border-b-amber-400 border-l-transparent" />
        </div>
    )
}
