import { run, opencode } from "@ai-hero/sandcastle"
import { docker } from "@ai-hero/sandcastle/sandboxes/docker"

await run({
    agent: opencode("opencode/big-pickle"),
    sandbox: docker({
        imageName: "sandcastle:next-bite",
        mounts: [
            {
                hostPath: "~/.config/opencode",
                sandboxPath: "/home/agent/.config/opencode",
                readonly: true,
            },
        ],
        env: {
            LINEAR_API_KEY: process.env.LINEAR_API_KEY ?? "",
        },
    }),
    promptFile: ".sandcastle/prompt.md",
})
