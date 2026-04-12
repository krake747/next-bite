import { Suspense, createSignal } from "solid-js"
import { createFileRoute } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "./-layout/header"
import { PageLayout } from "./-layout/page-layout"
import { PageContainer } from "./-layout/page-container"
import { BackNav } from "../features/back-nav"
import { useRestaurants } from "../core/hooks"
import { Button } from "../ui/button"
import Sparkles from "lucide-solid/icons/sparkles"
import { RestaurantCard } from "../features/restaurants/restaurant-card"
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
                        <HeaderTitle>Spin the wheel</HeaderTitle>
                        <HeaderSubtitle>Let fate decide your next bite</HeaderSubtitle>
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
                                                <div class="space-y-8">
                                                    <WinnerMessage restaurantName={wheel.selected()!.name} />
                                                    <div class="animate-card-reveal relative mx-auto w-full max-w-md">
                                                        <div class="absolute -inset-4 rounded-3xl bg-flame-pea-500/10 blur-2xl" />
                                                        <div class="relative">
                                                            <RestaurantCard restaurant={wheel.selected()!} />
                                                        </div>
                                                    </div>
                                                    <div class="flex justify-center">
                                                        <Button
                                                            variant="primary"
                                                            size="lg"
                                                            onClick={() => wheel.spin()}
                                                            disabled={wheel.isSpinning()}
                                                            class="min-w-40"
                                                        >
                                                            <Sparkles class="size-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                                                            <span>Spin Again</span>
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
