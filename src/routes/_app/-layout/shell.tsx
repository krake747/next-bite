import { AppNav } from "./nav"

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div data-slot="app-shell" className="flex flex-1 flex-col md:flex-row">
            <AppNav />
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
        </div>
    )
}
