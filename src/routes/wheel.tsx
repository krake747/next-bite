import { Show, Suspense, createSignal } from "solid-js"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { useRestaurants } from "../core/hooks"
import { Footer } from "../features/footer"
import { Button } from "../ui/button"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import Settings from "lucide-solid/icons/settings"
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
    const navigate = useNavigate()
    const restaurants = useRestaurants()
    const safeRestaurants = () => restaurants() ?? []
    const wheel = useWheelStore(safeRestaurants)
    const [showSettings, setShowSettings] = createSignal(false)

    return (
        <WheelProvider store={wheel}>
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
        </WheelProvider>
    )
}
