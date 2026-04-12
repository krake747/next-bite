import { Link } from "@tanstack/solid-router"
import { Button } from "../ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import Settings from "lucide-solid/icons/settings"

interface BackNavProps {
    backTo?: string
    onBack?: () => void
    showConfigure?: boolean
    onConfigure?: () => void
    isSpinning?: boolean
}

export function BackNav(props: BackNavProps) {
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
                {props.showConfigure && (
                    <Button variant="secondary" size="md" onClick={props.onConfigure} disabled={props.isSpinning}>
                        <Settings class="size-4 transition-transform duration-300 group-hover:rotate-45" />
                        Configure
                    </Button>
                )}
            </div>
        </div>
    )
}
