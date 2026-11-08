import { Link } from "@tanstack/react-router"

import { useAuth } from "@core/session"

export function SignedOutGate({
    context,
    children,
}: Readonly<{ context: string; children: React.ReactNode }>): React.ReactNode {
    const auth = useAuth()
    if (auth.isAuthenticated) {
        return children
    }
    return (
        <p className="pt-6 text-stone-600">
            <Link to="/login" className="font-medium text-tomato-700 hover:underline">
                Sign in
            </Link>{" "}
            to see {context}.
        </p>
    )
}
