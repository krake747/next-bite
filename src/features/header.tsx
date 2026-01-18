import { UtensilsCrossed } from "lucide-solid"
import { DarkModeToggle } from "./dark-mode-toggle"

export function Header({ count }: { count: () => number }) {
    return (
        <header class="px-6 py-16 sm:py-24 lg:px-8 lg:py-32 dark:bg-neutral-900">
            <div class="mx-auto max-w-2xl text-center">
                <div class="inline-flex size-12 items-center justify-center rounded-2xl bg-flame-pea-100 text-flame-pea-600 sm:size-16">
                    <UtensilsCrossed class="text-primary size-6 sm:size-8" />
                </div>
                <h2 class="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl dark:text-white">
                    My next bite
                </h2>
                <p class="mt-8 text-lg font-medium text-pretty text-neutral-500 sm:text-xl/8 dark:text-neutral-400">
                    {count()} places we're dreaming of trying together
                </p>
                <p class="mt-4 flex items-center justify-center">
                    <DarkModeToggle />
                </p>
            </div>
        </header>
    )
}
