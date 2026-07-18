import { run, opencode } from "@ai-hero/sandcastle"
import { docker } from "@ai-hero/sandcastle/sandboxes/docker"

await run({
    agent: opencode("opencode/big-pickle"),
    sandbox: docker({ imageName: "sandcastle:next-bite" }),
    promptFile: ".sandcastle/prompt.md",
})
