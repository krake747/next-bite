import { useForm, Field, Form } from "@formisch/react"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import * as v from "valibot"

import { useAuth } from "@core/hooks"
import { AuthLayout } from "@routes/-layouts/auth-layout"
import { Button } from "@ui/button"
import { FieldWrapper, Input } from "@ui/field"
import { LoadingPlaceholder } from "@ui/loading"

const LoginSchema = v.object({
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
})

type LoginInput = v.InferInput<typeof LoginSchema>

export const Route = createFileRoute("/login")({
    head: () => ({ meta: [{ title: "Sign In - Next Bite" }] }),
    component: LoginPage,
})

function LoginPage() {
    const navigate = useNavigate()
    const auth = useAuth()

    const form = useForm({ schema: LoginSchema })

    const handleEmailSubmit = async (output: LoginInput) => {
        try {
            await auth.signInWithPassword(output.email, output.password)
            navigate({ to: "/", replace: true, from: Route.fullPath })
        } catch {
            return
        }
    }

    if (auth.isLoading) return <LoadingPlaceholder />

    return (
        <AuthLayout
            icon={<UtensilsCrossed className="size-8" />}
            title={
                <h2
                    className="relative text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                >
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
                            className="text-flame-pea-500 dark:text-flame-pea-400"
                        />
                    </svg>
                </h2>
            }
            subtitle="Sign in to continue to your next bite"
            footerLink={
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Do not have an account?{" "}
                    <Link
                        to="/signup"
                        viewTransition
                        className="font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                    >
                        Sign up
                    </Link>
                </p>
            }
        >
            {auth.error && (
                <div className="mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm dark:bg-red-900/20 dark:text-red-400">
                    {auth.error}
                </div>
            )}

            <Form of={form} onSubmit={handleEmailSubmit} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={auth.isLoading}>
                    {auth.isLoading ? "Signing in..." : "Sign In"}
                </Button>
            </Form>
        </AuthLayout>
    )
}
