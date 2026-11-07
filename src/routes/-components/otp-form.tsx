import { Field, Form, useField, useForm } from "@formisch/react"
import * as v from "valibot"

import { useAuth } from "@core/hooks"
import { FieldWrapper, Input } from "@ui/field"

import { PendingButton } from "./pending-button"

const OtpEmailSchema = v.object({
    email: v.pipe(v.string(), v.email()),
})

const OtpCodeSchema = v.object({
    code: v.pipe(v.string(), v.minLength(6)),
})

export function OtpForm({
    onSuccess,
    email,
    onEmailChange,
}: Readonly<{
    onSuccess: () => void
    email: string | undefined
    onEmailChange: (email: string | undefined) => void
}>) {
    const auth = useAuth()
    const emailForm = useForm({ schema: OtpEmailSchema })
    const emailField = useField(emailForm, { path: ["email"] })
    const codeForm = useForm({ schema: OtpCodeSchema })
    const codeField = useField(codeForm, { path: ["code"] })

    const handleSend = async (output: Readonly<{ email: string }>) => {
        const ok = await auth.requestOtp(output.email)
        if (!ok) {
            return
        }
        onEmailChange(output.email)
    }

    const handleVerify = async (output: Readonly<{ code: string }>) => {
        if (email === undefined) {
            return
        }
        const ok = await auth.verifyOtp(email, output.code)
        if (!ok) {
            return
        }
        onSuccess()
    }

    if (email === undefined) {
        return (
            <Form of={emailForm} onSubmit={handleSend} className="space-y-4">
                <Field of={emailForm} path={["email"]}>
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
                <PendingButton type="submit" tone="secondary" className="w-full" pending={auth.isLoading}>
                    Email me a code
                </PendingButton>
            </Form>
        )
    }

    return (
        <Form of={codeForm} onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-stone-600">
                Code sent to {email}.{" "}
                <button
                    type="button"
                    className="font-medium text-tomato-600 underline-offset-2 hover:underline"
                    onClick={() => {
                        onEmailChange(undefined)
                    }}
                >
                    Use a different email
                </button>
            </p>
            <Field of={codeForm} path={["code"]}>
                {() => (
                    <FieldWrapper errors={codeField.errors}>
                        <Input
                            input={codeField.input}
                            errors={codeField.errors}
                            label="Code"
                            placeholder="123456"
                            {...codeField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
            <PendingButton type="submit" className="w-full" pending={auth.isLoading}>
                Verify code
            </PendingButton>
        </Form>
    )
}
