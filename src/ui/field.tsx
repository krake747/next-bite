export function FieldWrapper(props: { field: any; children: any }) {
    return (
        <div>
            {props.children}
            <FieldErrors field={props.field} />
        </div>
    )
}

export function Input(props: { field: any; type?: string; placeholder?: string }) {
    return (
        <input
            {...props.field.props}
            value={props.field.input}
            type={props.type ?? "text"}
            placeholder={props.placeholder ?? ""}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        />
    )
}

export function Textarea(props: { field: any; placeholder?: string; rows?: number }) {
    return (
        <textarea
            {...props.field.props}
            value={props.field.input ?? ""}
            placeholder={props.placeholder ?? ""}
            rows={props.rows ?? 3}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        />
    )
}

export function Select(props: { field: any; children: any }) {
    return (
        <select
            {...props.field.props}
            value={props.field.input}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        >
            {props.children}
        </select>
    )
}

function FieldErrors(props: { field: any }) {
    return props.field.errors ? <div class="text-sm text-red-500">{props.field.errors[0]}</div> : null
}
