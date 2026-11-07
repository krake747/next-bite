import { useForm, Field, Form, useField } from "@formisch/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import UserIcon from "lucide-react/icons/user"
import { useState } from "react"
import * as v from "valibot"

import { useAuth, useAuthMethods, isSafeRedirectPath } from "@core/hooks"
import { PendingButton } from "@routes/-components/pending-button"
import { AuthDivider, SocialButtons } from "@routes/-components/social-buttons"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { ErrorBanner } from "@ui/error-banner"
import { FieldWrapper, Input } from "@ui/field"
import { LoadingPlaceholder } from "@ui/loading"
import { TextLink } from "@ui/text-link"

const SignupSearchSchema = v.object({
    redirect: v.optional(v.string()),
})

const SignupSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
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

    const [passwordError, setPasswordError] = useState<string | null>(null)

    const form = useForm({ schema: SignupSchema })
    const nameField = useField(form, { path: ["name"] })
    const emailField = useField(form, { path: ["email"] })
    const passwordField = useField(form, { path: ["password"] })
    const confirmPasswordField = useField(form, { path: ["confirmPassword"] })
    const methods = useAuthMethods()

    const handleSubmit = async (output: Readonly<SignupInput>) => {
        setPasswordError(null)

        if (output.password !== output.confirmPassword) {
            setPasswordError("Passwords do not match")
            return
        }

        try {
            await auth.signUpWithPassword(output.name, output.email, output.password)
            const safeRedirect = isSafeRedirectPath(redirectTo) ? redirectTo : "/"
            void navigate({ to: safeRedirect, replace: true, from: Route.fullPath })
        } catch {
            return
        }
    }

    if (auth.isLoading) {
        return <LoadingPlaceholder />
    }

    const bannerError = [passwordError, auth.error].find((part) => part !== null && part !== "")

    return (
        <AuthLayout
            icon={<UserIcon className="size-8" />}
            title={
                <h2 className="relative font-display text-4xl font-semibold tracking-tight text-balance text-stone-900 sm:text-5xl">
                    Join Next Bite
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
            subtitle="Create an account to start adding restaurants"
            footerLink={
                <p className="text-sm text-stone-600">
                    Already have an account? <TextLink render={<Link to="/login" viewTransition />}>Sign in</TextLink>
                </p>
            }
        >
            {bannerError !== undefined && <ErrorBanner>{bannerError}</ErrorBanner>}

            <Form of={form} onSubmit={handleSubmit} className="space-y-4">
                <Field of={form} path={["name"]}>
                    {() => (
                        <FieldWrapper errors={nameField.errors}>
                            <Input
                                input={nameField.input}
                                errors={nameField.errors}
                                type="text"
                                label="Name"
                                placeholder="Your name"
                                {...nameField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
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
                <Field of={form} path={["confirmPassword"]}>
                    {() => (
                        <FieldWrapper errors={confirmPasswordField.errors}>
                            <Input
                                input={confirmPasswordField.input}
                                errors={confirmPasswordField.errors}
                                type="password"
                                label="Confirm password"
                                placeholder="••••••••"
                                {...confirmPasswordField.props}
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                    Create Account
                </PendingButton>
            </Form>
            {(methods?.google === true || methods?.github === true) && (
                <>
                    <AuthDivider />
                    <SocialButtons
                        google={methods.google}
                        github={methods.github}
                        redirect={isSafeRedirectPath(redirectTo) ? redirectTo : "/"}
                    />
                </>
            )}
        </AuthLayout>
    )
}
