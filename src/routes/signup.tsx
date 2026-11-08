import { useForm, Field, Form, useField } from "@formisch/react"
import { UserIcon } from "@phosphor-icons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import * as v from "valibot"

import { isSafeRedirectPath } from "@core/groups"
import { clearError, type FormError } from "@core/outcome"
import { useAuth, useAuthMethods } from "@core/session"
import { PendingButton } from "@routes/-components/pending-button"
import { AuthDivider, SocialButtons } from "@routes/-components/social-buttons"
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
    confirmPassword: v.string(),
})

type SignupInput = v.InferInput<typeof SignupSchema>

export const Route = createFileRoute("/signup")({
    validateSearch: SignupSearchSchema,
    head: () => ({ meta: [{ title: "Sign Up - Next Bite" }] }),
    component: SignupPage,
})

function SignupPage() {
    const navigate = useNavigate()
    const { redirect: redirectTo } = Route.useSearch()
    const auth = useAuth()

    const [passwordError, setPasswordError] = useState<FormError>(clearError)

    const form = useForm({ schema: SignupSchema, validate: "submit", revalidate: "input" })
    const nameField = useField(form, { path: ["name"] })
    const emailField = useField(form, { path: ["email"] })
    const passwordField = useField(form, { path: ["password"] })
    const confirmPasswordField = useField(form, { path: ["confirmPassword"] })
    const methods = useAuthMethods()

    const handleSubmit = async (output: Readonly<SignupInput>) => {
        setPasswordError(clearError)

        if (output.password !== output.confirmPassword) {
            setPasswordError({ kind: "error", message: "Passwords do not match" })
            return
        }

        const ok = await auth.signUpWithPassword(output.name, output.email, output.password)
        if (!ok) {
            return
        }
        const safeRedirect = isSafeRedirectPath(redirectTo) ? redirectTo : "/"
        void navigate({ to: safeRedirect, replace: true, from: Route.fullPath })
    }

    if (auth.isLoading) {
        return <LoadingPlaceholder />
    }

    const passwordMessage = passwordError.kind === "error" ? passwordError.message : ""
    const bannerError = [passwordMessage, auth.error].find((part) => part !== null && part !== "")

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
            {bannerError !== undefined && <ErrorBanner>{bannerError}</ErrorBanner>}

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
                <Field of={form} path={["confirmPassword"]}>
                    {() => (
                        <Input
                            input={confirmPasswordField.input}
                            errors={confirmPasswordField.errors}
                            type="password"
                            label="Confirm password"
                            placeholder="••••••••"
                            {...confirmPasswordField.props}
                        />
                    )}
                </Field>
                <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                    Sign up
                </PendingButton>
            </Form>
        </AuthLayout>
    )
}
