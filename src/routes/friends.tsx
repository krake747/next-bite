import { createFileRoute } from "@tanstack/react-router"

import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"

export const Route = createFileRoute("/friends")({
    head: () => ({ meta: [{ title: "Friends - Next Bite" }] }),
    component: FriendsPage,
})

function FriendsPage() {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Friends</HeaderTitle>
                    <HeaderSubtitle>See what your crew is craving. Friend connections land here next.</HeaderSubtitle>
                </Header>
            </PageContainer>
        </PageLayout>
    )
}
