import { createFileRoute } from "@tanstack/react-router"

import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"

export const Route = createFileRoute("/groups")({
    head: () => ({ meta: [{ title: "Groups - Next Bite" }] }),
    component: GroupsPage,
})

function GroupsPage() {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Groups</HeaderTitle>
                    <HeaderSubtitle>Plan the next table together. Group lists land here next.</HeaderSubtitle>
                </Header>
            </PageContainer>
        </PageLayout>
    )
}
