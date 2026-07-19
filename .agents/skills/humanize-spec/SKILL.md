---
name: humanize-spec
description: "Add a human-readable TL;DR to a spec issue."
disable-model-invocation: true
---

Add a condensed TL;DR section to the top of a spec issue so a human can grasp the essentials in
under 30 seconds. The full spec stays intact below a divider for agents.

## Process

### 1. Find the spec issue

Read the issue identified by the user (or infer it from conversation context — the most recent
`ready-for-agent` spec in play).

### 2. Extract the essentials

From the spec description, pull:

- **Problem** — the user-facing problem from the Problem Statement section. One to two sentences.
- **Solution** — what we are building, from the Solution section. One to three sentences.
- **Key decisions** — the three to five most consequential choices from Implementation Decisions.
  Skip config trivia (lint rules, file paths, package names). Keep architectural direction, tech
  choices, sequence constraints, and notable out-of-scope boundaries.

### 3. Write the TL;DR

Use plain language. A teammate who has not read the spec should understand it.

```
## TL;DR

**Problem**: [1–2 sentences]

**Solution**: [1–3 sentences on what changes]

**Key decisions**: [3–5 bullets — direction, not detail]

---
```

Each bullet is one sentence. No narrative justification, no file paths, no code.

### 4. Prepend to the issue

Use `linear_save_issue` to update the spec issue's `description`. If a TL;DR section already exists,
replace it rather than duplicating.

The divider `---` separates the TL;DR from the original spec content. Preserve all original content
below the divider.
