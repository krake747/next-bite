# Validated env module owns all reads

`import.meta.env` was read directly at four call sites with hand-written presence checks. We added
`src/core/env.ts` as the single validated reader: a Valibot schema parses the three `VITE_*` values
once at import, required values fail fast, and malformed URLs fail loudly instead of degrading at
runtime. All call sites read from `env`; `AGENTS.md` records the rule.

**Considered Options**

- **Keep direct reads**: Rejected because each call site re-decides what missing means, and a
  missing key surfaces far from its cause.
- **Single validated module**: Chosen so key shapes and defaults have one home. `parseEnv` stays
  exported and covered by `src/core/env.pure.spec.ts`, and Vitest projects carry dummy values so the
  module import never throws under test.

**Consequences**

- Adding a variable means extending the schema plus the spec, not scattering reads.
