import { createSignal, Show } from "solid-js"
import { createFileRoute, useNavigate, Link } from "@tanstack/solid-router"
import { createForm, Field, Form } from "@formisch/solid"
import { useAuth } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input } from "../ui/field"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import UserIcon from "lucide-solid/icons/user"
import LoaderPinwheel from "lucide-solid/icons/loader-pinwheel"
import * as v from "valibot"

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

    const [passwordError, setPasswordError] = createSignal<string | null>(null)

    const form = createForm({ schema: SignupSchema })

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

    return (
        <Show
            when={!auth.isLoading()}
            fallback={
                <div class="flex min-h-screen items-center justify-center bg-[#faf9f7] dark:bg-[#1a1918]">
                    <div class="text-center">
                        <div class="inline-flex size-12 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600">
                            <LoaderPinwheel class="size-6 animate-spin" aria-hidden="true" />
                        </div>
                        <p class="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
                    </div>
                </div>
            }
        >
            <div class="relative flex min-h-screen flex-col overflow-hidden bg-[#faf9f7] dark:bg-[#1a1918]">
                {/* Noise texture */}
                <div
                    class="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                    style={{
                        "background-image": `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Gradient mesh background */}
                <div class="pointer-events-none absolute inset-0">
                    <div class="absolute top-0 left-0 h-full w-1/2 bg-linear-to-br from-flame-pea-100/40 via-transparent to-transparent dark:from-flame-pea-900/20" />
                    <div class="absolute right-0 bottom-0 h-full w-1/2 bg-linear-to-tl from-orange-100/30 via-transparent to-transparent dark:from-orange-900/10" />
                </div>

                {/* Floating orbs */}
                <div class="animate-float pointer-events-none absolute top-[20%] left-[10%] h-32 w-32 rounded-full bg-flame-pea-300/15 blur-[80px] will-change-transform" />
                <div
                    class="animate-float pointer-events-none absolute right-[15%] bottom-[10%] h-24 w-24 rounded-full bg-orange-300/10 blur-[60px] will-change-transform"
                    style={{ "animation-delay": "1s" }}
                />

                {/* Grid pattern */}
                <div
                    class="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
                    style={{
                        "background-image": `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                        "background-size": "60px 60px",
                    }}
                />

                {/* Main content */}
                <div class="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                    <div class="w-full max-w-md">
                        {/* Header */}
                        <div class="mb-8 text-center">
                            <div class="mx-auto mb-6 inline-flex">
                                <div class="relative">
                                    <div class="absolute inset-0 rounded-full bg-flame-pea-500/20 blur-2xl" />
                                    <div class="absolute inset-0 animate-pulse rounded-full bg-flame-pea-400/10 blur-xl" />
                                    <div class="relative flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)] dark:from-flame-pea-600 dark:to-flame-pea-700 dark:shadow-[0_8px_30px_rgb(181,57,32,0.4)]">
                                        <UserIcon class="size-8" />
                                    </div>
                                    <div class="absolute top-0 -right-2 size-3 rounded-full bg-yellow-400" />
                                </div>
                            </div>
                            <h2
                                class="relative text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-white"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                Join Next Bite
                                <svg
                                    class="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2"
                                    viewBox="0 0 100 8"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d="M0 6 Q25 0 50 6 T100 6"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        class="text-flame-pea-500 dark:text-flame-pea-400"
                                    />
                                </svg>
                            </h2>
                            <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                                Create an account to start adding restaurants
                            </p>
                        </div>

                        {/* Form card */}
                        <div class="relative rounded-2xl border border-neutral-200/60 bg-white/80 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[0_4px_20px_rgb(0,0,0,0.3)]">
                            <Show when={auth.error() || passwordError()}>
                                {(err) => (
                                    <div class="mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm dark:bg-red-900/20 dark:text-red-400">
                                        {err()}
                                    </div>
                                )}
                            </Show>

                            <Form of={form} onSubmit={handleSubmit} class="space-y-4">
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
                                <Button type="submit" class="w-full" disabled={auth.isLoading()}>
                                    {auth.isLoading() ? "Creating account..." : "Create Account"}
                                </Button>
                            </Form>
                        </div>

                        {/* Sign in link */}
                        <div class="mt-6 text-center">
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    class="font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        {/* Back to home */}
                        <div class="mt-4 text-center">
                            <Link
                                to="/"
                                class="group inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                            >
                                <UtensilsCrossed
                                    class="size-4 transition-transform group-hover:-rotate-12"
                                    aria-hidden="true"
                                />
                                Back to home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    )
}
