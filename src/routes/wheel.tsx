import { Show, Suspense, createSignal } from "solid-js"
import { createFileRoute } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "./-layout/header"
import { PageLayout } from "./-layout/page-layout"
import { PageContainer } from "./-layout/page-container"
import { BackNav } from "@features/back-nav"
import { useRestaurants } from "@core/hooks"
import { useWheelStore } from "@features/wheel/wheel-store"
import { WheelProvider } from "@features/wheel/wheel-context"
import { SpinningWheel } from "@features/wheel/spinning-wheel"
import { WheelConfigModal } from "@features/wheel/wheel-config-modal"
import { EmptyWheelState } from "@features/wheel/empty-wheel-state"
import { Instructions, WinnerModal } from "@features/wheel/wheel-messages"

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
                        showWheelOptions
                        onRandom={() => {
                            wheel.setSelectionMode("random")
                            wheel.spin()
                        }}
                        onBuildYourOwn={() => setShowSettings(true)}
                        isSpinning={wheel.isSpinning()}
                        disabled={!wheel.hasEnoughRestaurants()}
                    />

                    <div class="pt-8">
                        <div class="mx-auto max-w-2xl">
                            <Suspense fallback={<EmptyWheelState />}>
                                <WheelConfigModal
                                    show={showSettings()}
                                    onOpenChange={setShowSettings}
                                    restaurants={safeRestaurants}
                                    defaultToManual={true}
                                    onSpin={() => wheel.spin()}
                                />
                                {!showSettings() && (
                                    <>
                                        {/* Instructions always visible above wheel */}
                                        <div class="mb-8">
                                            <Instructions />
                                        </div>

                                        <div class="relative flex flex-col items-center">
                                            <SpinningWheel />
                                        </div>

                                        <Show when={wheel.selected()}>
                                            {(selected) => (
                                                <WinnerModal
                                                    show={!!selected()}
                                                    onOpenChange={(open) => {
                                                        if (!open) {
                                                            wheel.clearSelected()
                                                        }
                                                    }}
                                                    restaurant={selected()}
                                                    onSpinAgain={() => wheel.spin()}
                                                    isSpinning={wheel.isSpinning()}
                                                />
                                            )}
                                        </Show>
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
