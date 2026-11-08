import { useForm, Field, Form, useField } from "@formisch/react"
import { UserIcon } from "@phosphor-icons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import * as v from "valibot"

import { isSafeRedirectPath } from "@core/groups"
import { useAuth, useAuthMethods } from "@core/session"
import { AuthDivider } from "@routes/-components/auth-divider"
import { OtpForm } from "@routes/-components/otp-form"
import { PendingButton } from "@routes/-components/pending-button"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { ErrorBanner } from "@ui/error-banner"
import { Input } from "@ui/field"
import { LoadingPlaceholder } from "@ui/loading"
import { TextLink } from "@ui/text-link"

const SignupSearchSchema = v.object({
    redirect: v.optional(v.string()),
})

const SignupSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Enter your name")),
    email: v.pipe(v.string(), v.email("Enter a valid email address")),
    password: v.pipe(v.string(), v.minLength(8, "Use at least 8 characters")),
})

type SignupInput = v.InferInput<typeof SignupSchema>

export const Route = createFileRoute("/signup")({
    validateSearch: SignupSearchSchema,
    head: () => ({ meta: [{ title: "Sign Up - Next Bite" }] }),
    component: SignupPage,
})

function SignupPasswordForm({ onSuccess }: Readonly<{ onSuccess: () => void }>) {
    const auth = useAuth()

    const form = useForm({ schema: SignupSchema, validate: "submit", revalidate: "input" })
    const nameField = useField(form, { path: ["name"] })
    const emailField = useField(form, { path: ["email"] })
    const passwordField = useField(form, { path: ["password"] })

    const handleSubmit = async (output: Readonly<SignupInput>) => {
        const ok = await auth.signUpWithPassword(output.name, output.email, output.password)
        if (!ok) {
            return
        }
        onSuccess()
    }

    return (
        <Form of={form} onSubmit={handleSubmit} className="space-y-4">
            <Field of={form} path={["name"]}>
                {() => (
                    <Input
                        input={nameField.input}
                        errors={nameField.errors}
                        type="text"
                        label="Name"
                        placeholder="Your name"
                        {...nameField.props}
                    />
                )}
            </Field>
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
                    <div>
                        <Input
                            input={passwordField.input}
                            errors={passwordField.errors}
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            {...passwordField.props}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
                    </div>
                )}
            </Field>
            <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                Sign up
            </PendingButton>
        </Form>
    )
}

function SignupAlternatives({ onOtpSuccess }: Readonly<{ onOtpSuccess: () => void }>) {
    const methods = useAuthMethods()
    const [otpEmail, setOtpEmail] = useState<string | undefined>(undefined)

    return (
        <>
            <SignupPasswordForm onSuccess={onOtpSuccess} />
            {methods?.emailOtp === true && (
                <>
                    <AuthDivider label="or use a code" />
                    <OtpForm onSuccess={onOtpSuccess} email={otpEmail} onEmailChange={setOtpEmail} />
                </>
            )}
        </>
    )
}

function SignupPage() {
    const navigate = useNavigate()
    const { redirect: redirectTo } = Route.useSearch()
    const auth = useAuth()

    const goHome = () => {
        const safeRedirect = isSafeRedirectPath(redirectTo) ? redirectTo : "/"
        void navigate({ to: safeRedirect, replace: true, from: Route.fullPath })
    }

    if (auth.isLoading) {
        return <LoadingPlaceholder />
    }

    return (
        <AuthLayout
            icon={<UserIcon className="size-8" />}
            title={
                <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                    Join Next Bite
                </h2>
            }
            subtitle="Create your login to start adding restaurants"
            footerLink={
                <p className="text-sm text-muted-foreground">
                    Already have a login? <TextLink render={<Link to="/login" />}>Sign in</TextLink>
                </p>
            }
        >
            {auth.error !== null && auth.error !== "" && <ErrorBanner>{auth.error}</ErrorBanner>}

            <SignupAlternatives onOtpSuccess={goHome} />
        </AuthLayout>
    )
}
