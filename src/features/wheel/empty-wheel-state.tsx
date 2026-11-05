import { Link } from "@tanstack/react-router"
import Plus from "lucide-react/icons/plus"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

export function EmptyWheelState() {
    return (
        <div className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-6">
                <div className="flex size-48 items-center justify-center rounded-full border-2 border-dashed border-tomato-300 bg-linear-to-br from-tomato-50 to-white sm:size-56">
                    <div className="text-center">
                        <div className="mb-3 flex justify-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-surface shadow-md">
                                <UtensilsCrossed className="size-7 text-tomato-600" />
                            </div>
                        </div>
                        <p
                            className="text-lg leading-snug font-semibold text-stone-800"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            The wheel is hungry
                        </p>
                    </div>
                </div>

                <div className="absolute -top-2 -right-2 size-4 rounded-full bg-tomato-400/30" />
                <div className="absolute -bottom-1 -left-3 size-3 rounded-full bg-tomato-300/40" />
            </div>

            <p className="mb-2 text-base text-stone-600">Add a restaurant to spin the wheel</p>

            <Link
                to="/"
                viewTransition
                className="inline-flex items-center gap-2 text-sm font-medium text-tomato-600 transition-colors hover:text-tomato-700"
            >
                <Plus className="size-4" />
                Go to restaurants
            </Link>
        </div>
    )
}
