export type FormError = { readonly kind: "clear" } | { readonly kind: "error"; readonly message: string }

export const clearError: FormError = { kind: "clear" }

export function errorFrom(input: unknown, fallback: string): FormError {
    if (input instanceof Error && input.message !== "") {
        return { kind: "error", message: input.message }
    }
    return { kind: "error", message: fallback }
}
