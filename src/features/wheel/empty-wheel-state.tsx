import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import { Link } from "@tanstack/react-router"
import Plus from "lucide-react/icons/plus"

export function EmptyWheelState() {
    return (
        <div className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-6">
                <div className="flex size-48 items-center justify-center rounded-full border-2 border-dashed border-flame-pea-300 bg-linear-to-br from-flame-pea-50 to-white sm:size-56 dark:border-flame-pea-800 dark:from-flame-pea-900/20 dark:to-[#1a1918]">
                    <div className="text-center">
                        <div className="mb-3 flex justify-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-md dark:bg-[#2d2c2b]">
                                <UtensilsCrossed className="size-7 text-flame-pea-600 dark:text-flame-pea-400" />
                            </div>
                        </div>
                        <p
                            className="text-lg leading-snug font-semibold text-neutral-800 dark:text-neutral-200"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            The wheel is hungry
                        </p>
                    </div>
                </div>

                <div className="absolute -top-2 -right-2 size-4 rounded-full bg-flame-pea-400/30 dark:bg-flame-pea-500/30" />
                <div className="absolute -bottom-1 -left-3 size-3 rounded-full bg-flame-pea-300/40 dark:bg-flame-pea-600/30" />
            </div>

            <p className="mb-2 text-base text-neutral-600 dark:text-neutral-400">Add a restaurant to spin the wheel</p>

            <Link
                to="/"
                viewTransition
                className="inline-flex items-center gap-2 text-sm font-medium text-flame-pea-600 transition-colors hover:text-flame-pea-700 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
            >
                <Plus className="size-4" />
                Go to restaurants
            </Link>
        </div>
    )
}
