/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY: string
    readonly VITE_CONVEX_URL: string
    readonly VITE_POSTHOG_KEY: string
    readonly VITE_GTM_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
