import { Link } from "@tanstack/react-router"
import ArrowLeft from "lucide-react/icons/arrow-left"

type BackNavProps = {
    backTo?: string
}

export function BackNav({ backTo }: Readonly<BackNavProps>) {
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
            </div>
        </div>
    )
}
