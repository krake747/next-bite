import { createSignal, Show, createEffect } from "solid-js"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { createForm, Field, Form } from "@formisch/solid"
import { useAuth } from "../core/hooks"
import { Button } from "../ui/button"
import { FieldWrapper, Input } from "../ui/field"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import LoaderPinwheel from "lucide-solid/icons/loader-pinwheel"
import * as v from "valibot"

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

    const [error, setError] = createSignal<string | null>(null)

    const form = createForm({ schema: LoginSchema })

    createEffect(() => {
        if (auth.isAuthenticated()) {
            navigate({ to: "/" })
        }
    })

    const handleEmailSubmit = async (output: LoginInput) => {
        setError(null)
        try {
            await auth.signInWithPassword(output.email, output.password)
            navigate({ to: "/" })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed")
        }
    }

    return (
        <Show
            when={!auth.isLoading()}
            fallback={
                <div class="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                    <div class="text-center">
                        <div class="inline-flex size-12 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600">
                            <LoaderPinwheel class="size-6 animate-spin" aria-hidden="true" />
                        </div>
                        <p class="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
                    </div>
                </div>
            }
        >
            <div class="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-900">
                <div class="w-full max-w-md space-y-8">
                    <div class="text-left">
                        <a
                            href="/"
                            class="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                        >
                            <ArrowLeft class="size-4" aria-hidden="true" />
                            Back to home
                        </a>
                    </div>

                    <div class="text-center">
                        <h2 class="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            Sign in to Next Bite
                        </h2>
                        <p class="mt-2 text-neutral-600 dark:text-neutral-400">Sign in with your email</p>
                    </div>

                    <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
                        <Show when={error()}>
                            {(err) => (
                                <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                    {err()}
                                </div>
                            )}
                        </Show>

                        <Form of={form} onSubmit={handleEmailSubmit} class="space-y-4">
                            <Field of={form} path={["email"]}>
                                {(field) => (
                                    <FieldWrapper errors={field.errors}>
                                        <Input
                                            {...field.props}
                                            input={field.input}
                                            errors={field.errors}
                                            type="email"
                                            placeholder="Email address"
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
                                            placeholder="Password (min 8 characters)"
                                        />
                                    </FieldWrapper>
                                )}
                            </Field>
                            <Button type="submit" class="w-full" disabled={auth.isLoading()}>
                                {auth.isLoading() ? "Signing in..." : "Sign In"}
                            </Button>
                        </Form>
                    </div>

                    <div class="text-center">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Do not have an account?{" "}
                            <a
                                href="/signup"
                                class="font-medium text-flame-pea-600 hover:text-flame-pea-500 dark:text-flame-pea-400"
                            >
                                Sign up
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </Show>
    )
}
