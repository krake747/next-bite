import { Show, Suspense, createSignal } from "solid-js"
import { createFileRoute, Link } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { PageLayout } from "../features/page-layout"
import { useRestaurants } from "../core/hooks"
import { Button } from "../ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import Settings from "lucide-solid/icons/settings"
import Sparkles from "lucide-solid/icons/sparkles"
import { RestaurantCard } from "../features/restaurant-card"
import { useWheelStore } from "../features/wheel/wheel-store"
import { WheelProvider } from "../features/wheel/wheel-context"
import { SpinningWheel } from "../features/wheel/spinning-wheel"
import { WheelConfigModal } from "../features/wheel/wheel-config-modal"
import { EmptyWheelState } from "../features/wheel/empty-wheel-state"
import { Instructions, WinnerMessage } from "../features/wheel/wheel-messages"

export const Route = createFileRoute("/wheel")({
    head: () => ({ meta: [{ title: "Spin the Wheel - Next Bite" }] }),
    component: WheelPage,
})

function WheelPage() {
    const restaurants = useRestaurants()
    const safeRestaurants = () => restaurants() ?? []
    const wheel = useWheelStore(safeRestaurants)
    const [showSettings, setShowSettings] = createSignal(false)

    return (
        <WheelProvider store={wheel}>
            <PageLayout>
                <div class="container mx-auto max-w-7xl px-4 pt-6 pb-8">
                    {/* Magazine-style header */}
                    <Header>
                        <div class="flex flex-col items-start">
                            <div class="inline-flex items-center gap-2 rounded-full bg-flame-pea-100 px-3 py-1 text-xs font-semibold tracking-wide text-flame-pea-700 uppercase dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
                                <Sparkles class="size-3" />
                                Decision Time
                            </div>
                            <HeaderTitle class="mt-3">Spin the wheel</HeaderTitle>
                            <HeaderSubtitle class="max-w-md">
                                Let fate decide your next bite. May the culinary odds be ever in your favor.
                            </HeaderSubtitle>
                        </div>
                    </Header>

                    {/* Action bar */}
                    <div class="border-b border-neutral-200/60 py-4 dark:border-white/10">
                        <div class="flex items-center justify-between gap-4">
                            <Link
                                to="/"
                                from={Route.fullPath}
                                class="group inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-flame-pea-700 dark:text-neutral-400 dark:hover:text-flame-pea-400"
                            >
                                <ArrowLeft class="size-4 transition-transform group-hover:-translate-x-0.5" />
                                Back to restaurants
                            </Link>
                            <Button variant="secondary" size="md" onClick={() => setShowSettings(true)}>
                                <Settings class="size-4" />
                                Configure
                            </Button>
                        </div>
                    </div>

                    {/* Wheel content */}
                    <div class="pt-8">
                        <div class="mx-auto max-w-2xl">
                            <Suspense fallback={<EmptyWheelState />}>
                                <Show when={showSettings()}>
                                    <WheelConfigModal
                                        restaurants={safeRestaurants}
                                        onClose={() => setShowSettings(false)}
                                    />
                                </Show>

                                {/* Wheel container */}
                                <div class="relative flex flex-col items-center">
                                    <SpinningWheel />
                                </div>

                                {/* Messages area */}
                                <div class="mt-8">
                                    <Show when={wheel.selected()} fallback={<Instructions />}>
                                        {(restaurant) => (
                                            <div class="space-y-6">
                                                <WinnerMessage />
                                                <RestaurantCard
                                                    class="animate-fade-in mx-auto w-full max-w-md"
                                                    restaurant={restaurant()}
                                                />
                                                <div class="flex justify-center">
                                                    <Button
                                                        variant="secondary"
                                                        size="md"
                                                        onClick={() => wheel.spin()}
                                                        disabled={wheel.isSpinning()}
                                                    >
                                                        <Sparkles class="size-4" />
                                                        Spin Again
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Show>
                                </div>
                            </Suspense>
                        </div>
                    </div>
                </div>
            </PageLayout>
        </WheelProvider>
    )
}
