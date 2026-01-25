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
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { useRestaurants, type Restaurant } from "../core/hooks"
import { Footer } from "../features/footer"
import { Button } from "../ui/button"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import RotateCw from "lucide-solid/icons/rotate-cw"
import { RestaurantCard } from "../features/restaurant-card"
import { useNavigate } from "@solidjs/router"
import { cx } from "../ui/variants"

export function Wheel() {
    const navigate = useNavigate()
    const restaurants = useRestaurants()
    const wheel = useWheelStore(restaurants)

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
                        <Button class="mb-8" onClick={() => navigate("/")}>
                            <UtensilsCrossed class="size-4" />
                            Go back home
                        </Button>
                        <Suspense fallback={<EmptyWheelState />}>
                            <SpinningWheel />
                        </Suspense>
                        <Show when={wheel.selected()} fallback={<Instructions />}>
                            {(restaurant) => (
                                <>
                                    <WinnerMessage />
                                    <RestaurantCard class="animate-fade-in" restaurant={restaurant()} />
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
}

function useWheelStore(restaurants: Accessor<Restaurant[]>) {
    const { spinDuration, spinCount } = WHEEL_CONFIG

    const [state, setState] = createStore<WheelState>({
        rotation: 0,
        spinStart: null,
        selected: null,
    })

    const [lockedSegments, setLockedSegments] = createSignal<Restaurant[]>([])

    createEffect(() => {
        const rest = restaurants()
        if (rest.length % 2 === 0) {
            setLockedSegments(rest)
            return
        }

        const dropIdx = Math.floor(Math.random() * rest.length)
        setLockedSegments(rest.filter((_, i) => i !== dropIdx))
    })

    const segments = createMemo(() => lockedSegments())

    const segmentCount = createMemo(() => segments().length)
    const hasSegments = createMemo(() => segmentCount() > 0)

    const isSpinning = createMemo(() => state.spinStart !== null)
    const elapsed = useElapsed(isSpinning, () => state.spinStart)

    const spinProgress = createMemo(() => Math.min(elapsed() / spinDuration, 1))
    const segmentAngle = createMemo(() => (hasSegments() ? 360 / segmentCount() : 0))

    const computedSelected = createMemo(() => {
        if (!spinProgress()) return null

        const normalize = (deg: number) => ((deg % 360) + 360) % 360
        // top of wheel
        const idx = Math.floor(normalize(270 - state.rotation) / segmentAngle())
        return segments()[idx] ?? null
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
        if (isSpinning() || !hasSegments()) return

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

    return {
        rotation: createMemo(() => state.rotation),
        selected: createMemo(() => state.selected),
        segments,
        isSpinning,
        // actions
        spin,
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

        // 60% of radius
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
            disabled={wheel.isSpinning() || wheel.segments().length === 0}
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
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">🎉 Winner! 🎉</h2>
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
