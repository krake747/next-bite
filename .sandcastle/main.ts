import { run, opencode } from "@ai-hero/sandcastle"
import { docker } from "@ai-hero/sandcastle/sandboxes/docker"

const args = process.argv.slice(2).filter((a) => a !== "--")
const taskDescription = args[0]

if (!taskDescription) {
    console.error("Usage: pnpm exec tsx .sandcastle/main.ts <task-description>")
    console.error("   or: pnpm sandcastle:run -- <task-description>")
    process.exit(1)
}

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
            GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "",
        },
    }),
    promptFile: ".sandcastle/prompt.md",
    promptArgs: {
        TASK_DESCRIPTION: taskDescription,
    },
})
