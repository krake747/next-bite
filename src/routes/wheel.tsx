import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { useRestaurants } from "@core/hooks"
import { BackNav } from "@features/back-nav"
import { EmptyWheelState } from "@features/wheel/empty-wheel-state"
import { SpinningWheel } from "@features/wheel/spinning-wheel"
import { WheelConfigModal } from "@features/wheel/wheel-config-modal"
import { WheelProvider } from "@features/wheel/wheel-context"
import { Instructions, WinnerModal } from "@features/wheel/wheel-messages"
import { useWheelStore } from "@features/wheel/wheel-store"

import { Header, HeaderSubtitle, HeaderTitle } from "./-layout/header"
import { PageContainer } from "./-layout/page-container"
import { PageLayout } from "./-layout/page-layout"

export const Route = createFileRoute("/wheel")({
    head: () => ({ meta: [{ title: "Spin the Wheel - Next Bite" }] }),
    component: WheelPage,
})

function WheelPage() {
    const restaurants = useRestaurants()
    const safeRestaurants = restaurants ?? []
    const wheel = useWheelStore(safeRestaurants)
    const [showSettings, setShowSettings] = useState(false)

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
                        isSpinning={wheel.isSpinning}
                        disabled={!wheel.hasEnoughRestaurants}
                    />

                    <div className="pt-8">
                        <div className="mx-auto max-w-2xl">
                            <Suspense fallback={<EmptyWheelState />}>
                                <WheelConfigModal
                                    show={showSettings}
                                    onOpenChange={setShowSettings}
                                    restaurants={safeRestaurants}
                                    defaultToManual={true}
                                    onSpin={() => wheel.spin()}
                                />
                                {!showSettings && (
                                    <>
                                        <div className="mb-8">
                                            <Instructions />
                                        </div>

                                        <div className="relative flex flex-col items-center">
                                            <SpinningWheel />
                                        </div>

                                        {wheel.selected && (
                                            <WinnerModal
                                                show={!!wheel.selected}
                                                onOpenChange={(open) => {
                                                    if (!open) {
                                                        wheel.clearSelected()
                                                    }
                                                }}
                                                restaurant={wheel.selected}
                                                onSpinAgain={() => wheel.spin()}
                                                isSpinning={wheel.isSpinning}
                                            />
                                        )}
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
