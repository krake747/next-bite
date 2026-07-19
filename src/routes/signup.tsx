import { useForm, Field, Form } from "@formisch/react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import UserIcon from "lucide-react/icons/user"
import { useState } from "react"
import * as v from "valibot"

import { useAuth } from "@core/hooks"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { Button } from "@ui/button"
import { FieldWrapper, Input } from "@ui/field"
import { LoadingPlaceholder } from "@ui/loading"

const SignupSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
    confirmPassword: v.string(),
})

type SignupInput = v.InferInput<typeof SignupSchema>

export const Route = createFileRoute("/signup")({
    head: () => ({ meta: [{ title: "Sign Up - Next Bite" }] }),
    component: SignupPage,
})

function SignupPage() {
    const navigate = useNavigate()
    const auth = useAuth()

    const [passwordError, setPasswordError] = useState<string | null>(null)

    const form = useForm({ schema: SignupSchema })

    const handleSubmit = async (output: SignupInput) => {
        setPasswordError(null)

        if (output.password !== output.confirmPassword) {
            setPasswordError("Passwords do not match")
            return
        }

        try {
            await auth.signUpWithPassword(output.name, output.email, output.password)
            navigate({ to: "/", replace: true, from: Route.fullPath })
        } catch {
            return
        }
    }

    if (auth.isLoading) return <LoadingPlaceholder />

    return (
        <AuthLayout
            icon={<UserIcon className="size-8" />}
            title={
                <h2
                    className="relative text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                >
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
                            className="text-flame-pea-500 dark:text-flame-pea-400"
                        />
                    </svg>
                </h2>
            }
            subtitle="Create an account to start adding restaurants"
            footerLink={
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        viewTransition
                        className="font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                    >
                        Sign in
                    </Link>
                </p>
            }
        >
            {(auth.error || passwordError) && (
                <div className="mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm dark:bg-red-900/20 dark:text-red-400">
                    {passwordError || auth.error}
                </div>
            )}

            <Form of={form} onSubmit={handleSubmit} className="space-y-4">
                <Field of={form} path={["name"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <Input
                                {...field.props}
                                input={field.input}
                                errors={field.errors}
                                type="text"
                                label="Name"
                                placeholder="Your name"
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["email"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <Input
                                {...field.props}
                                input={field.input}
                                errors={field.errors}
                                type="email"
                                label="Email"
                                placeholder="you@example.com"
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["password"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <Input
                                {...field.props}
                                input={field.input}
                                errors={field.errors}
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Field of={form} path={["confirmPassword"]}>
                    {(field) => (
                        <FieldWrapper errors={field.errors}>
                            <Input
                                {...field.props}
                                input={field.input}
                                errors={field.errors}
                                type="password"
                                label="Confirm password"
                                placeholder="••••••••"
                            />
                        </FieldWrapper>
                    )}
                </Field>
                <Button type="submit" className="w-full" disabled={auth.isLoading}>
                    {auth.isLoading ? "Creating account..." : "Create Account"}
                </Button>
            </Form>
        </AuthLayout>
    )
}
