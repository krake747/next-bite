import { Field, setInput, type FormStore } from "@formisch/react"

import { RestaurantSchema } from "@core/schemas"
import { EmojiRating } from "@pattern/emoji-rating"
import { FieldErrors, FieldWrapper, Input, Textarea } from "@pattern/field"
import { PlacesAutocomplete, type PlaceSelection } from "@pattern/places-autocomplete"
import { fieldLabel } from "@ui/variants"

type RestaurantFormStore = FormStore<typeof RestaurantSchema>

export function NameCuisineFields({ form }: Readonly<{ form: RestaurantFormStore }>) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Field of={form} path={["name"]}>
                {(nameField) => (
                    <Input
                        input={nameField.input}
                        errors={nameField.errors}
                        label="Restaurant name"
                        placeholder="The fancy burger restaurant"
                        {...nameField.props}
                    />
                )}
            </Field>
            <Field of={form} path={["cuisine"]}>
                {(cuisineField) => (
                    <Input
                        input={cuisineField.input}
                        errors={cuisineField.errors}
                        label="Cuisine"
                        placeholder="Burgers, Italian, etc."
                        {...cuisineField.props}
                    />
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
    onLocationChange: (selection: PlaceSelection) => void
}>) {
    return (
        <Field of={form} path={["location"]}>
            {(locationField) => (
                <FieldWrapper>
                    <PlacesAutocomplete
                        value={locationField.input ?? ""}
                        onChange={onLocationChange}
                        label="Location"
                        placeholder="Search for a restaurant…"
                    />
                    <FieldErrors errors={locationField.errors} />
                </FieldWrapper>
            )}
        </Field>
    )
}

export function NotesSection({ form }: Readonly<{ form: RestaurantFormStore }>) {
    return (
        <Field of={form} path={["notes"]}>
            {(notesField) => (
                <Textarea
                    input={notesField.input}
                    errors={notesField.errors}
                    label="Notes"
                    placeholder="What to order…"
                    rows={3}
                    {...notesField.props}
                />
            )}
        </Field>
    )
}

export function LinkField({ form }: Readonly<{ form: RestaurantFormStore }>) {
    return (
        <Field of={form} path={["link"]}>
            {(linkField) => (
                <Input
                    input={linkField.input}
                    errors={linkField.errors}
                    type="url"
                    label="Menu link"
                    placeholder="https://menu.com/…"
                    {...linkField.props}
                />
            )}
        </Field>
    )
}

export function RatingSection({ form }: Readonly<{ form: RestaurantFormStore }>) {
    return (
        <Field of={form} path={["rating"]}>
            {(ratingField) => {
                const value =
                    typeof ratingField.input === "number" && ratingField.input >= 1 && ratingField.input <= 7
                        ? ratingField.input - 1
                        : undefined
                return (
                    <FieldWrapper>
                        <fieldset>
                            <legend className={fieldLabel()}>Rating</legend>
                            <div className="mt-2">
                                <EmojiRating
                                    rating={value}
                                    onRate={(index) => {
                                        setInput(form, { path: ["rating"], input: index + 1 })
                                    }}
                                />
                            </div>
                        </fieldset>
                        <FieldErrors errors={ratingField.errors} />
                    </FieldWrapper>
                )
            }}
        </Field>
    )
}
