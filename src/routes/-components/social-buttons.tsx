import { useAuth } from "@core/session"

import { PendingButton } from "./pending-button"

export function SocialButtons({
    google,
    github,
    redirect,
}: Readonly<{ google: boolean; github: boolean; redirect?: string | undefined }>) {
    const auth = useAuth()
    if (!google && !github) {
        return null
    }
    return (
        <div className="flex flex-col gap-2">
            {google && (
                <PendingButton
                    type="button"
                    tone="secondary"
                    className="w-full"
                    pending={auth.isLoading}
                    onClick={() => {
                        // Auth errors land in the auth store; the step resolves false instead of rejecting.
                        void auth.signInWithSocial("google", redirect)
                    }}
                >
                    Continue with Google
                </PendingButton>
            )}
            {github && (
                <PendingButton
                    type="button"
                    tone="secondary"
                    className="w-full"
                    pending={auth.isLoading}
                    onClick={() => {
                        // Auth errors land in the auth store; the step resolves false instead of rejecting.
                        void auth.signInWithSocial("github", redirect)
                    }}
                >
                    Continue with GitHub
                </PendingButton>
            )}
        </div>
    )
}

export function AuthDivider() {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium tracking-wide text-stone-500 uppercase">or</span>
            <div className="h-px flex-1 bg-border" />
        </div>
    )
}
