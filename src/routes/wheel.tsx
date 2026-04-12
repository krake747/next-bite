import { Suspense, createSignal } from "solid-js"
import { createFileRoute } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { PageLayout } from "../features/page-layout"
import { PageContainer } from "../features/page-container"
import { BackNav } from "../features/back-nav"
import { useRestaurants } from "../core/hooks"
import { Button } from "../ui/button"
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
                <PageContainer>
                    <Header>
                        <div class="flex flex-col items-start">
                            <div class="group relative inline-flex items-center gap-2 rounded-full bg-linear-to-r from-flame-pea-500 to-orange-500 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_4px_15px_rgb(181,57,32,0.3)] transition-all duration-200 ease-out hover:shadow-[0_6px_20px_rgb(181,57,32,0.4)] dark:from-flame-pea-600 dark:to-orange-600 dark:shadow-[0_4px_15px_rgb(181,57,32,0.5)]">
                                <Sparkles class="size-3" />
                                <span>Decision Time</span>
                                <div class="absolute inset-0 -translate-x-full skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-300 ease-out group-hover:translate-x-full" />
                            </div>
                            <HeaderTitle class="mt-5">Spin the wheel</HeaderTitle>
                            <HeaderSubtitle class="max-w-md">
                                Let fate decide your next bite. May the culinary odds be ever in your favor.
                            </HeaderSubtitle>
                            <div class="mt-8 flex items-center gap-4">
                                <div class="flex items-center gap-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                    <span class="flex size-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10">
                                        1
                                    </span>
                                    <span class="ml-2">Spin</span>
                                </div>
                                <div class="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                                <div class="flex items-center gap-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                    <span class="flex size-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10">
                                        2
                                    </span>
                                    <span class="ml-2">Discover</span>
                                </div>
                                <div class="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                                <div class="flex items-center gap-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                    <span class="flex size-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10">
                                        3
                                    </span>
                                    <span class="ml-2">Eat</span>
                                </div>
                            </div>
                        </div>
                    </Header>

                    <BackNav
                        backTo="/"
                        showConfigure
                        onConfigure={() => setShowSettings(true)}
                        isSpinning={wheel.isSpinning()}
                    />

                    <div class="pt-8">
                        <div class="mx-auto max-w-2xl">
                            <Suspense fallback={<EmptyWheelState />}>
                                <WheelConfigModal
                                    show={showSettings()}
                                    onOpenChange={setShowSettings}
                                    restaurants={safeRestaurants}
                                />
                                {!showSettings() && (
                                    <>
                                        <div class="relative flex flex-col items-center">
                                            <SpinningWheel />
                                        </div>
                                        <div class="mt-8">
                                            {wheel.selected() ? (
                                                <div class="space-y-6">
                                                    <WinnerMessage />
                                                    <RestaurantCard
                                                        class="animate-fade-in mx-auto w-full max-w-md"
                                                        restaurant={wheel.selected()!}
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
                                            ) : (
                                                <Instructions />
                                            )}
                                        </div>
                                    </>
                                )}
                            </Suspense>
                        </div>
                    </div>
                </PageContainer>
            </PageLayout>
        </WheelProvider>
    )
}
