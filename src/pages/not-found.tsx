import { A } from "@solidjs/router"
import ArrowRight from "lucide-solid/icons/arrow-right"

export function NotFound() {
    return (
        <div class="grid min-h-dvh grid-rows-1">
            <main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
                <div class="text-center">
                    <p class="text-base font-semibold text-flame-pea-600 dark:text-flame-pea-400">404</p>
                    <h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Page not found</h1>
                    <p class="mt-6 text-lg font-medium text-pretty text-neutral-500 sm:text-xl/8 dark:text-neutral-400">
                        Oops. This page went out for snacks and never came back.
                    </p>
                    <div class="mt-10 flex items-center justify-center gap-x-6">
                        <A
                            href="/"
                            class="rounded-md bg-flame-pea-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-flame-pea-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-600 dark:bg-flame-pea-500 dark:hover:bg-flame-pea-400 dark:focus-visible:outline-flame-pea-500"
                        >
                            Go back home
                        </A>
                        <a
                            href="https://github.com/krake747/next-bite"
                            class="inline-flex items-center gap-1 text-sm font-semibold"
                        >
                            Suggest this page on GitHub
                            <ArrowRight class="size-4" />
                        </a>
                    </div>
                </div>
            </main>
        </div>
    )
}
