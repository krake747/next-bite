/// <reference types="vite/client" />

declare module "lucide-react/icons/*" {
    import type { SVGProps, RefAttributes, ForwardRefExoticComponent } from "react"
    const Icon: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>>
    export default Icon
}

interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY: string
    readonly VITE_CONVEX_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
