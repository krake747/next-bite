import { useForm, Field, Form, useField } from "@formisch/react"
import { ForkKnifeIcon } from "@phosphor-icons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import * as v from "valibot"

import { isSafeRedirectPath } from "@core/groups"
import { useAuth, useAuthMethods } from "@core/session"
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
    const [otpEmail, setOtpEmail] = useState<string | undefined>(undefined)

    const goHome = () => {
        const safeRedirect = isSafeRedirectPath(redirectTo) ? redirectTo : "/"
        void navigate({ to: safeRedirect, replace: true, from: Route.fullPath })
    }

    const handleEmailSubmit = async (output: Readonly<LoginInput>) => {
        const ok = await auth.signInWithPassword(output.email, output.password)
        if (!ok) {
            return
        }
        goHome()
    }

    if (auth.isLoading) {
        return <LoadingPlaceholder />
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
                    New to Next Bite? <TextLink render={<Link to="/signup" viewTransition />}>Sign up</TextLink>
                </p>
            }
        >
            {auth.error !== null && auth.error !== "" && <ErrorBanner>{auth.error}</ErrorBanner>}

            {(methods?.google === true || methods?.github === true) && (
                <>
                    <SocialButtons
                        google={methods.google}
                        github={methods.github}
                        redirect={isSafeRedirectPath(redirectTo) ? redirectTo : "/"}
                    />
                    <AuthDivider label="or use your email" />
                </>
            )}

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
            {methods?.emailOtp === true && (
                <>
                    <AuthDivider label="or use a code" />
                    <OtpForm onSuccess={goHome} email={otpEmail} onEmailChange={setOtpEmail} />
                </>
            )}
        </AuthLayout>
    )
}
