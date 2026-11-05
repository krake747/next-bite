import { Field, setInput, useField, type FormStore } from "@formisch/react"

import { useFriends } from "@core/hooks"
import { RestaurantSchema } from "@core/schemas"
import { EmojiRating } from "@pattern/emoji-rating"
import { PlacesAutocomplete } from "@pattern/places-autocomplete"
import { FieldWrapper, Input, Select, Textarea, labelClass } from "@ui/field"

type RestaurantFormStore = FormStore<typeof RestaurantSchema>

export function NameCuisineFields({ form }: Readonly<{ form: RestaurantFormStore }>) {
    const nameField = useField(form, { path: ["name"] })
    const cuisineField = useField(form, { path: ["cuisine"] })
    return (
        <div className="grid grid-cols-2 gap-4">
            <Field of={form} path={["name"]}>
                {() => (
                    <FieldWrapper errors={nameField.errors}>
                        <Input
                            input={nameField.input}
                            errors={nameField.errors}
                            label="Restaurant name"
                            placeholder="The fancy burger place"
                            {...nameField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
            <Field of={form} path={["cuisine"]}>
                {() => (
                    <FieldWrapper errors={cuisineField.errors}>
                        <Input
                            input={cuisineField.input}
                            errors={cuisineField.errors}
                            label="Cuisine"
                            placeholder="Burgers, Italian, etc."
                            {...cuisineField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
        </div>
    )
}

export function LocationSection({
    form,
    onLocationChange,
}: Readonly<{
    form: RestaurantFormStore
    onLocationChange: (address: string, lat?: number, lng?: number) => void
}>) {
    const locationField = useField(form, { path: ["location"] })
    return (
        <Field of={form} path={["location"]}>
            {() => (
                <FieldWrapper errors={locationField.errors}>
                    <PlacesAutocomplete
                        value={locationField.input ?? ""}
                        onChange={onLocationChange}
                        label="Location"
                        placeholder="Search for a restaurant…"
                    />
                </FieldWrapper>
            )}
        </Field>
    )
}

export function NotesSection({ form }: Readonly<{ form: RestaurantFormStore }>) {
    const notesField = useField(form, { path: ["notes"] })
    return (
        <Field of={form} path={["notes"]}>
            {() => (
                <FieldWrapper errors={notesField.errors}>
                    <Textarea
                        input={notesField.input}
                        errors={notesField.errors}
                        label="Notes"
                        placeholder="What to order…"
                        rows={3}
                        {...notesField.props}
                    />
                </FieldWrapper>
            )}
        </Field>
    )
}

export function LinkAddedByFields({ form }: Readonly<{ form: RestaurantFormStore }>) {
    const friends = useFriends()
    const linkField = useField(form, { path: ["link"] })
    const addedByField = useField(form, { path: ["addedBy"] })
    return (
        <div className="grid grid-cols-2 gap-4">
            <Field of={form} path={["link"]}>
                {() => (
                    <FieldWrapper errors={linkField.errors}>
                        <Input
                            input={linkField.input}
                            errors={linkField.errors}
                            type="url"
                            label="Menu link"
                            placeholder="https://menu.com/…"
                            {...linkField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
            <Field of={form} path={["addedBy"]}>
                {() => (
                    <FieldWrapper errors={addedByField.errors}>
                        <Select
                            input={addedByField.input}
                            errors={addedByField.errors}
                            label="Added by"
                            options={[
                                { value: "", label: "Select friend" },
                                ...(friends ?? []).map((f: Readonly<{ name: string }>) => ({
                                    value: f.name,
                                    label: f.name,
                                })),
                            ]}
                            {...addedByField.props}
                        />
                    </FieldWrapper>
                )}
            </Field>
        </div>
    )
}

export function RatingSection({ form }: Readonly<{ form: RestaurantFormStore }>) {
    const ratingField = useField(form, { path: ["rating"] })
    const value = typeof ratingField.input === "number" && ratingField.input >= 1 ? ratingField.input : null
    return (
        <Field of={form} path={["rating"]}>
            {() => (
                <FieldWrapper errors={ratingField.errors}>
                    <label className={labelClass}>Rating</label>
                    <div className="mt-2">
                        <EmojiRating
                            rating={value}
                            onRate={(rating) => {
                                setInput(form, { path: ["rating"], input: rating })
                            }}
                        />
                    </div>
                </FieldWrapper>
            )}
        </Field>
    )
}
