import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"

export function SocialButtons({ google, github }: Readonly<{ google: boolean; github: boolean }>) {
    const auth = useAuth()
    if (!google && !github) {
        return null
    }
    return (
        <div className="flex flex-col gap-2">
            {google && (
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    loading={auth.isLoading}
                    onClick={() => {
                        void auth.signInWithSocial("google").catch(() => {})
                    }}
                >
                    Continue with Google
                </Button>
            )}
            {github && (
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    loading={auth.isLoading}
                    onClick={() => {
                        void auth.signInWithSocial("github").catch(() => {})
                    }}
                >
                    Continue with GitHub
                </Button>
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
