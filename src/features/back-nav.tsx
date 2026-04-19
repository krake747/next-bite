import { Link } from "@tanstack/solid-router"
import { Button } from "@ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import Shuffle from "lucide-solid/icons/shuffle"
import Sliders from "lucide-solid/icons/sliders"

type BackNavProps = {
    backTo?: string
    onBack?: () => void
    showWheelOptions?: boolean
    onRandom?: () => void
    onBuildYourOwn?: () => void
    isSpinning?: boolean
    disabled?: boolean
}

export function BackNav(props: BackNavProps) {
    const disabled = () => props.disabled || props.isSpinning

    return (
        <div data-component="back-nav" class="border-b border-neutral-200/60 py-4 dark:border-white/10">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to={props.backTo ?? "/"}
                    viewTransition
                    class="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors duration-150 ease hover:text-flame-pea-700 dark:text-neutral-400 dark:hover:text-flame-pea-400"
                >
                    <ArrowLeft class="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px" />
                    <span class="hidden sm:inline">Back to restaurants</span>
                    <span class="sm:hidden">Back</span>
                </Link>
                {props.showWheelOptions && (
                    <div class="flex w-full items-center gap-2 sm:w-auto">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={props.onRandom}
                            disabled={disabled()}
                            class="flex-1 sm:flex-initial"
                        >
                            <Shuffle class="size-4" />
                            <span class="hidden sm:inline">Random</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={props.onBuildYourOwn}
                            disabled={disabled()}
                            class="flex-1 sm:flex-initial"
                        >
                            <Sliders class="size-4" />
                            <span class="hidden sm:inline">Build Your Own</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
