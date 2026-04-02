/// <reference types="node" />

declare namespace NodeJS {
    interface ProcessEnv {
        SITE_URL: string
        CONVEX_SITE_URL: string
    }
}
