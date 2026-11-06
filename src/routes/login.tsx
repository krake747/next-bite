import { useForm, Field, Form, useField } from "@formisch/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import * as v from "valibot"

import { useAuth, useAuthMethods } from "@core/hooks"
import { OtpForm } from "@routes/-components/otp-form"
import { PendingButton } from "@routes/-components/pending-button"
import { AuthDivider, SocialButtons } from "@routes/-components/social-buttons"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { ErrorBanner } from "@ui/error-banner"
import { FieldWrapper, Input } from "@ui/field"
import { LoadingPlaceholder } from "@ui/loading"
import { TextLink } from "@ui/text-link"

const LoginSearchSchema = v.object({
    redirect: v.optional(v.string()),
})

const LoginSchema = v.object({
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
})

type LoginInput = v.InferInput<typeof LoginSchema>

export const Route = createFileRoute("/login")({
    validateSearch: LoginSearchSchema,
    head: () => ({ meta: [{ title: "Sign In - Next Bite" }] }),
    component: LoginPage,
})

function LoginPage() {
    const navigate = useNavigate()
    const { redirect: redirectTo } = Route.useSearch()
    const auth = useAuth()

    const form = useForm({ schema: LoginSchema })
    const emailField = useField(form, { path: ["email"] })
    const passwordField = useField(form, { path: ["password"] })
    const methods = useAuthMethods()

    const goHome = () => {
        void navigate({ to: redirectTo ?? "/", replace: true, from: Route.fullPath })
    }

    const handleEmailSubmit = async (output: Readonly<LoginInput>) => {
        try {
            await auth.signInWithPassword(output.email, output.password)
            goHome()
        } catch {
            return
        }
    }

    if (auth.isLoading) {
        return <LoadingPlaceholder />
    }

    return (
        <AuthLayout
            icon={<UtensilsCrossed className="size-8" />}
            title={
                <h2 className="relative font-display text-4xl font-semibold tracking-tight text-balance text-stone-900 sm:text-5xl">
                    Welcome back
                    <svg
                        className="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2"
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 6 Q25 0 50 6 T100 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-tomato-500"
                        />
                    </svg>
                </h2>
            }
            subtitle="Sign in to continue to your next bite"
            footerLink={
                <p className="text-sm text-stone-600">
                    Do not have an account? <TextLink render={<Link to="/signup" viewTransition />}>Sign up</TextLink>
                </p>
            }
        >
            {auth.error !== null && auth.error !== "" && <ErrorBanner>{auth.error}</ErrorBanner>}

            <Form of={form} onSubmit={handleEmailSubmit} className="space-y-4">
                <Field of={form} path={["email"]}>
                    {() => (
                        <FieldWrapper errors={emailField.errors}>
                            <Input
                                input={emailField.input}
                                errors={emailField.errors}
                                type="email"
                                label="Email"
                                placeholder="you@example.com"
                                {...emailField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["password"]}>
                    {() => (
                        <FieldWrapper errors={passwordField.errors}>
                            <Input
                                input={passwordField.input}
                                errors={passwordField.errors}
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                {...passwordField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                    Sign In
                </PendingButton>
            </Form>
            {(methods?.google === true || methods?.github === true) && (
                <>
                    <AuthDivider />
                    <SocialButtons google={methods.google} github={methods.github} />
                </>
            )}
            {methods?.emailOtp === true && (
                <>
                    <AuthDivider />
                    <OtpForm onSuccess={goHome} />
                </>
            )}
        </AuthLayout>
    )
}
