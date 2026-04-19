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
            <div class="flex items-center justify-between gap-4">
                <Link
                    to={props.backTo ?? "/"}
                    viewTransition
                    class="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors duration-150 ease hover:text-flame-pea-700 dark:text-neutral-400 dark:hover:text-flame-pea-400"
                >
                    <ArrowLeft class="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px" />
                    Back to restaurants
                </Link>
                {props.showWheelOptions && (
                    <div class="flex items-center gap-2">
                        <Button variant="primary" size="md" onClick={props.onRandom} disabled={disabled()}>
                            <Shuffle class="size-4" />
                            Random
                        </Button>
                        <Button variant="secondary" size="md" onClick={props.onBuildYourOwn} disabled={disabled()}>
                            <Sliders class="size-4" />
                            Build Your Own
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
