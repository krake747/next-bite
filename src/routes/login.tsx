import { useForm, Field, Form, useField } from "@formisch/react"
import { ForkKnifeIcon } from "@phosphor-icons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import * as v from "valibot"

import { useAuth, useAuthMethods } from "@core/session"
import { ErrorBanner } from "@pattern/error-banner"
import { Input } from "@pattern/field"
import { AppInitializing } from "@pattern/loading"
import { AuthDivider } from "@routes/-components/auth-divider"
import { redirectSignedIn, signedInDestination } from "@routes/-components/auth-redirects"
import { OtpForm } from "@routes/-components/otp-form"
import { PendingButton } from "@routes/-components/pending-button"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { TextLink } from "@ui/text-link"

const LoginSearchSchema = v.object({
    redirect: v.optional(v.string()),
})

const LoginSchema = v.object({
    email: v.pipe(v.string(), v.email("Enter a valid email address")),
    password: v.pipe(v.string(), v.minLength(8, "Use at least 8 characters")),
})

type LoginInput = v.InferInput<typeof LoginSchema>

export const Route = createFileRoute("/login")({
    validateSearch: LoginSearchSchema,
    beforeLoad: ({ context, search }) => {
        redirectSignedIn(context.auth, signedInDestination(search.redirect))
    },
    head: () => ({ meta: [{ title: "Sign In - Next Bite" }] }),
    component: LoginPage,
})

function LoginPage() {
    const auth = useAuth()

    const form = useForm({ schema: LoginSchema, validate: "submit", revalidate: "input" })
    const emailField = useField(form, { path: ["email"] })
    const passwordField = useField(form, { path: ["password"] })
    const methods = useAuthMethods()
    const [otpEmail, setOtpEmail] = useState<string | undefined>(undefined)

    const handleEmailSubmit = async (output: Readonly<LoginInput>) => {
        await auth.signInWithPassword(output.email, output.password)
    }

    if (auth.isInitializing) {
        return <AppInitializing />
    }

    return (
        <AuthLayout
            icon={<ForkKnifeIcon className="size-8" />}
            title={
                <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                    Welcome back
                </h2>
            }
            subtitle="Sign in to continue to your next bite"
            footerLink={
                <p className="text-sm text-muted-foreground">
                    New to Next Bite? <TextLink render={<Link to="/signup" />}>Sign up</TextLink>
                </p>
            }
        >
            {auth.error !== null && auth.error !== "" && <ErrorBanner>{auth.error}</ErrorBanner>}

            <Form of={form} onSubmit={handleEmailSubmit} className="space-y-4">
                <Field of={form} path={["email"]}>
                    {() => (
                        <Input
                            input={emailField.input}
                            errors={emailField.errors}
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            {...emailField.props}
                        />
                    )}
                </Field>
                <Field of={form} path={["password"]}>
                    {() => (
                        <Input
                            input={passwordField.input}
                            errors={passwordField.errors}
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            {...passwordField.props}
                        />
                    )}
                </Field>
                <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                    Sign In
                </PendingButton>
            </Form>
            {methods?.emailOtp === true && (
                <>
                    <AuthDivider label="or use a code" />
                    <OtpForm email={otpEmail} onEmailChange={setOtpEmail} />
                </>
            )}
        </AuthLayout>
    )
}
