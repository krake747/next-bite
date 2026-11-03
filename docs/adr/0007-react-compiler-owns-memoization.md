# React Compiler owns memoization

Hand memoization litters components with dependency arrays that rot silently. The compiler settles
caching at build time: components stay plain and declarative with no manual cache calls. The build
runs the native compiler through `@vitejs/plugin-react` (`compiler: { target: "19" }`) backed by
`oxc-transform-react`, and the compiler lint rules run as errors, so conflicting patterns get
rewritten rather than suppressed. `AGENTS.md` records the rule.

**Considered Options**

- **Manual memo by default**: Rejected because dependency arrays steal review time from behavior and
  fail silently when stale.
- **Babel compiler preset**: Rejected because the native path is faster and removes the Babel bridge
  from the build.

**Consequences**

- No `useMemo`, `useCallback`, or `React.memo` in hand-written code; the audit found none to remove.
- Code must stay compilable: `try`/`finally` and ref-during-render patterns that the compiler cannot
  model stay as lint allows until rewritten, not as suppressions.
