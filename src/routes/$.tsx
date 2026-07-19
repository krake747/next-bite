import { Link, createFileRoute } from "@tanstack/react-router"
import ArrowRight from "lucide-react/icons/arrow-right"

import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"

export const Route = createFileRoute("/$")({
    head: () => ({ meta: [{ title: "Page Not Found - Next Bite" }] }),
    component: NotFoundPage,
})

function NotFoundPage() {
    return (
        <PageLayout>
            <PageContainer>
                <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
                    <div className="text-center">
                        <p className="text-base font-semibold text-flame-pea-600 dark:text-flame-pea-400">404</p>
                        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
                            Page not found
                        </h1>
                        <p className="mt-6 text-lg font-medium text-pretty text-neutral-500 sm:text-xl/8 dark:text-neutral-400">
                            Oops. This page went out for snacks and never came back.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/"
                                className="rounded-md bg-flame-pea-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-flame-pea-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-600 dark:bg-flame-pea-500 dark:hover:bg-flame-pea-400 dark:focus-visible:outline-flame-pea-500"
                            >
                                Go back home
                            </Link>
                            <a
                                href="https://github.com/krake747/next-bite"
                                className="inline-flex items-center gap-1 text-sm font-semibold"
                            >
                                Suggest this page on GitHub
                                <ArrowRight className="size-4" />
                            </a>
                        </div>
                    </div>
                </main>
            </PageContainer>
        </PageLayout>
    )
}
