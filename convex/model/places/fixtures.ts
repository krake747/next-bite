// Canned Google Places responses for fixture mode. Raw Google shapes, parsed
// and converted through the same schemas as live responses, so fixtures prove
// the shape instead of bypassing it. Enabled per call from the action layer
// (see isGooglePlacesFixturesEnabled); dev only, never on preview or prod.

// Options threaded from the action layer, which owns env reads. Model code
// never reads env directly (zone boundary).
export type FixtureOptions = {
    readonly fixtures?: boolean | undefined
}
export const fixtureCombinedDetails = {
    displayName: { text: "Fixture Bistro" },
    primaryType: "french_restaurant",
    googleMapsUri: "https://maps.google.com/?cid=fixture",
    businessStatus: "OPERATIONAL",
    utcOffsetMinutes: 60,
    currentOpeningHours: {
        openNow: true,
        periods: [{ open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 22, minute: 0 } }],
        weekdayDescriptions: ["Monday: 9:00 AM – 10:00 PM"],
    },
    rating: 4.2,
    userRatingCount: 42,
    priceLevel: "PRICE_LEVEL_MODERATE",
    websiteUri: "https://example.com/fixture-bistro",
}

export const fixtureLocation = {
    location: { latitude: 49.61, longitude: 6.13 },
    viewport: {
        low: { latitude: 49.6, longitude: 6.12 },
        high: { latitude: 49.62, longitude: 6.14 },
    },
}
