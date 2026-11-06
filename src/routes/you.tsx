import { createFileRoute } from "@tanstack/react-router"

import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"

export const Route = createFileRoute("/you")({
    head: () => ({ meta: [{ title: "You - Next Bite" }] }),
    component: YouPage,
})

function YouPage() {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>You</HeaderTitle>
                    <HeaderSubtitle>Your saves, wants, and shouts. Personal stats land here next.</HeaderSubtitle>
                </Header>
            </PageContainer>
        </PageLayout>
    )
}
