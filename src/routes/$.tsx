import { ArrowRightIcon } from "@phosphor-icons/react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { PageContainer } from "@routes/-layouts/page-container"

export const Route = createFileRoute("/$")({
    head: () => ({ meta: [{ title: "Page Not Found - Next Bite" }] }),
    component: NotFoundPage,
})

function NotFoundPage() {
    return (
        <main data-slot="page-layout" className="flex min-h-screen flex-col">
            <PageContainer className="flex flex-1 flex-col items-center justify-center">
                <div className="text-center">
                    <p className="text-base font-semibold text-tomato-600">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
                        Page not found
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
                        Oops. This page went out for snacks and never came back.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/"
                            className="rounded-md bg-tomato-600 px-3.5 py-2.5 text-sm font-semibold text-inverse shadow-xs hover:bg-tomato-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato-600"
                        >
                            Go back home
                        </Link>
                        <a
                            href="https://github.com/krake747/next-bite"
                            className="inline-flex items-center gap-1 text-sm font-semibold"
                        >
                            Suggest this page on GitHub
                            <ArrowRightIcon className="size-4" />
                        </a>
                    </div>
                </div>
            </PageContainer>
        </main>
    )
}
