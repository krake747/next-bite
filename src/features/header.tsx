import { UtensilsCrossed } from "lucide-solid"
import { DarkModeToggle } from "./dark-mode-toggle"

export function Header({ count }: { count: () => number }) {
    return (
        <header class="px-6 py-24 sm:py-32 lg:px-8 dark:bg-neutral-900">
            <div class="mx-auto max-w-2xl text-center">
                <div class="inline-flex size-16 items-center justify-center rounded-2xl bg-flame-pea-100 text-flame-pea-600">
                    <UtensilsCrossed class="text-primary size-8" />
                </div>
                <h2 class="mt-2 text-5xl font-semibold tracking-tight text-neutral-900 sm:text-7xl dark:text-white">
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
