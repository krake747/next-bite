import { Link } from "@tanstack/solid-router"
import { Button } from "../ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import Settings from "lucide-solid/icons/settings"

type BackNavProps = {
    backTo?: string
    onBack?: () => void
    showConfigure?: boolean
    onConfigure?: () => void
    isSpinning?: boolean
}

export function BackNav(props: BackNavProps) {
    return (
        <div class="relative">
            <Link
                to={props.backTo ?? "/"}
                viewTransition
                class="group absolute top-1/2 left-0 z-10 -mt-6 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-sm font-medium text-neutral-600 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-colors duration-150 ease hover:text-flame-pea-700 dark:bg-neutral-800/80 dark:text-neutral-400 dark:ring-white/10 dark:hover:text-flame-pea-400"
            >
                <ArrowLeft class="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px" />
                Back
            </Link>

            {props.showConfigure && (
                <div class="flex justify-center">
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={props.onConfigure}
                        disabled={props.isSpinning}
                        class="shadow-lg ring-1 ring-black/5 dark:ring-white/10"
                    >
                        <Settings class="size-4 transition-transform duration-300 group-hover:rotate-45" />
                        Configure
                    </Button>
                </div>
            )}
        </div>
    )
}
