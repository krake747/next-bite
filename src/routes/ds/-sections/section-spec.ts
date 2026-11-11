import { expect } from "vitest"

import { type SectionMeta } from "./registry"

export function expectSectionMeta(
    meta: SectionMeta,
    expected: Readonly<{ importPath: string; props: ReadonlyArray<string> }>,
): void {
    expect(meta.importPath).toBe(expected.importPath)
    expect(meta.props?.map((prop) => prop.name)).toStrictEqual(expected.props)
    expect(meta.guidance?.whenToUse.length).toBeGreaterThan(0)
}
