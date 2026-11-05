import { Link } from "@tanstack/react-router"
import ArrowLeft from "lucide-react/icons/arrow-left"
import Shuffle from "lucide-react/icons/shuffle"
import Sliders from "lucide-react/icons/sliders"

import { Button } from "@ui/button"

type BackNavProps = {
    backTo?: string
    onBack?: () => void
    showWheelOptions?: boolean
    onRandom?: () => void
    onBuildYourOwn?: () => void
    isSpinning?: boolean
    disabled?: boolean
}

export function BackNav({
    backTo,
    showWheelOptions,
    onRandom,
    onBuildYourOwn,
    isSpinning,
    disabled,
}: Readonly<BackNavProps>) {
    const isDisabled = disabled === true || isSpinning === true

    return (
        <div data-slot="back-nav" className="border-b border-stone-200/60 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to={backTo ?? "/"}
                    viewTransition
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors duration-150 ease hover:text-tomato-700"
                >
                    <ArrowLeft className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px" />
                    <span className="hidden sm:inline">Back to restaurants</span>
                    <span className="sm:hidden">Back</span>
                </Link>
                {showWheelOptions === true && (
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Button
                            variant="primary"
                            size="md"
                            nativeButton
                            onClick={onRandom}
                            disabled={isDisabled}
                            className="flex-1 sm:flex-initial"
                        >
                            <Shuffle className="size-4" />
                            <span className="hidden sm:inline">Random</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="md"
                            nativeButton
                            onClick={onBuildYourOwn}
                            disabled={isDisabled}
                            className="flex-1 sm:flex-initial"
                        >
                            <Sliders className="size-4" />
                            <span className="hidden sm:inline">Build Your Own</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
