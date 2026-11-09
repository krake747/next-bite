import { ArrowLeftIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

type BackNavProps = {
    backTo: string
    label: string
}

export function BackNav({ backTo, label }: Readonly<BackNavProps>) {
    return (
        <div data-slot="back-nav" className="border-b border-border py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-tomato-700"
                >
                    <ArrowLeftIcon className="size-4" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">Back</span>
                </Link>
            </div>
        </div>
    )
}
