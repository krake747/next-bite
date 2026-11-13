# Trigger recipes

Wrong to right snippets for each escalation trigger in `SKILL.md`. Copy the shape, not the names.

## `useMemo`, `useCallback`, `React.memo`

Wrong:

```tsx
const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text)
}, [text])
```

Right: a plain function. React Compiler owns memoization (ADR-0009).

```tsx
function handleCopy(): void {
    void navigator.clipboard.writeText(text)
}
```

## `useContext`

Wrong:

```tsx
import { useContext } from "react"
const entry = useContext(SectionEntryContext)
```

Right: the repo reads context through `use()` (lint-enforced).

```tsx
import { use } from "react"
const entry = use(SectionEntryContext)
```

## `as` cast or non-null assertion

Wrong:

```tsx
const id = ids[index] as string
```

Right: narrow first, fix at the source.

```tsx
const id = ids.at(index)
if (id === undefined) {
    return null
}
```

## `Omit` to redeclare, `...rest` spread

Wrong:

```tsx
type Props = Omit<BaseProps, "render" | "children"> & {
    children: React.ReactNode
    render: React.ReactElement
}
function Panel({ children, ...rest }: Props) { ... }
```

Right: extend the base type as is, destructure `children`, name the spread `...props`.

```tsx
type Props = BaseProps & { extra: string }
function Panel({ children, extra, ...props }: Props) { ... }
```

## `children` riding in the spread

Wrong:

```tsx
function Card(props: Props) {
    return <div {...props} />
}
```

Right: destructure and render `children` explicitly.

```tsx
function Card({ children, ...props }: Props) {
    return <div {...props}>{children}</div>
}
```

## Multi-line logic inline in JSX

Wrong:

```tsx
<IconButton
    label="Copy"
    onClick={() => {
        void navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(true)
            })
            .catch(() => {
                setCopied(false)
            })
    }}
>
```

Right: a named handler; JSX references it.

```tsx
<IconButton label="Copy" onClick={handleCopy}>
```

## Prop drilled through an intermediary

Wrong:

```tsx
function Page({ entry }: Props) {
    return <Body entry={entry} />
}
function Body({ entry }: Props) {
    return <Title title={entry.meta.title} />
}
```

Right: provide once, read where used.

```tsx
<EntryContext value={entry}>
    <Title />
</EntryContext>
```

## Nullable state reaching render

Wrong:

```tsx
const [error, setError] = useState<string | null>(null)
return <p>{error}</p>
```

Right: narrow through a union before render (see the absent-UI-state rule in `CODING_STANDARDS.md`).

```tsx
if (error === null) {
    return null
}
return <p>{error}</p>
```

## Swallowing catch

Wrong:

```tsx
.catch(() => {})
```

Right: map the failure into state the UI reads, or delete the catch. A `catch` that only swallows gets deleted in favor of letting the caller handle it.

## Arrow function declarations

Wrong:

```tsx
const PagerLink: React.FC<Props> = ({ sectionId, children }) => {
    return (...)
}
```

Right: function declarations, except in-component handlers, inline callbacks, and one-liners.

```tsx
function PagerLink({ sectionId, children }: Props) {
    return (...)
}
```
