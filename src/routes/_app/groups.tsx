import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/groups")({
    head: () => ({ meta: [{ title: "Groups - Next Bite" }] }),
    component: GroupsLayout,
})

function GroupsLayout() {
    return <Outlet />
}
