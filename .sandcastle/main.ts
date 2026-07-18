import * as sandcastle from "@ai-hero/sandcastle"
import { docker } from "@ai-hero/sandcastle/sandboxes/docker"

const MAX_ITERATIONS = 10

const hooks = {
    sandbox: { onSandboxReady: [{ command: "pnpm install" }] },
}

const copyToWorktree: string[] = ["node_modules"]

type Model = "opencode/big-pickle" | "opencode-go/deepseek-v4-flash" | "opencode-go/deepseek-v4-pro"

const PLANNER_MODEL: Model = "opencode/big-pickle"
const IMPLEMENTER_MODEL: Model = "opencode-go/deepseek-v4-flash"
const REVIEWER_MODEL: Model = "opencode-go/deepseek-v4-flash"
const MERGER_MODEL: Model = "opencode-go/deepseek-v4-flash"

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`)

    const plan = await sandcastle.run({
        hooks,
        sandbox: docker(),
        name: "planner",
        maxIterations: 1,
        idleTimeoutSeconds: 600,
        agent: sandcastle.opencode(PLANNER_MODEL),
        promptFile: "./.sandcastle/plan-prompt.md",
    })

    const planMatch = plan.stdout.match(/<plan>([\s\S]*?)<\/plan>/)
    if (!planMatch) {
        throw new Error("Planning agent did not produce a <plan> tag.\n\n" + plan.stdout)
    }

    const { issues } = JSON.parse(planMatch[1]!) as {
        issues: { id: string; title: string; branch: string; labels: string[] }[]
    }

    if (issues.length === 0) {
        console.log("No unblocked issues. Exiting.")
        break
    }

    console.log(`Planning complete. ${issues.length} issue(s) in parallel:`)
    for (const issue of issues) {
        console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`)
    }

    const settled = await Promise.allSettled(
        issues.map(async (issue) => {
            await using sandbox = await sandcastle.createSandbox({
                branch: issue.branch,
                sandbox: docker(),
                hooks,
                copyToWorktree,
            })

            const implement = await sandbox.run({
                name: "implementer",
                maxIterations: 100,
                idleTimeoutSeconds: 600,
                agent: sandcastle.opencode(IMPLEMENTER_MODEL, {
                    env: { OPENCODE_PERMISSION: "allow" },
                }),
                promptFile: "./.sandcastle/implement-prompt.md",
                promptArgs: {
                    TASK_ID: issue.id,
                    ISSUE_TITLE: issue.title,
                    BRANCH: issue.branch,
                },
            })

            if (implement.commits.length > 0) {
                const review = await sandbox.run({
                    name: "reviewer",
                    maxIterations: 1,
                    idleTimeoutSeconds: 600,
                    agent: sandcastle.opencode(REVIEWER_MODEL),
                    promptFile: "./.sandcastle/review-prompt.md",
                    promptArgs: {
                        BRANCH: issue.branch,
                    },
                })

                return {
                    ...review,
                    commits: [...implement.commits, ...review.commits],
                }
            }

            return implement
        }),
    )

    for (const [i, outcome] of settled.entries()) {
        if (outcome.status === "rejected") {
            console.error(`  ✗ ${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`)
        }
    }

    const completedIssues = settled
        .map((outcome, i) => ({ outcome, issue: issues[i]! }))
        .filter((entry) => entry.outcome.status === "fulfilled" && entry.outcome.value.commits.length > 0)
        .map((entry) => entry.issue)

    const completedBranches = completedIssues.map((i) => i.branch)

    console.log(`\nExecution complete. ${completedBranches.length} branch(es) with commits:`)
    for (const branch of completedBranches) {
        console.log(`  ${branch}`)
    }

    if (completedBranches.length === 0) {
        console.log("No commits produced. Nothing to merge.")
        continue
    }

    await sandcastle.run({
        hooks,
        sandbox: docker(),
        name: "merger",
        maxIterations: 1,
        idleTimeoutSeconds: 900,
        agent: sandcastle.opencode(MERGER_MODEL),
        promptFile: "./.sandcastle/merge-prompt.md",
        promptArgs: {
            BRANCHES: completedBranches.map((b) => `- ${b}`).join("\n"),
            ISSUES: completedIssues.map((i) => `- ${i.id}: ${i.title}`).join("\n"),
        },
    })

    console.log("\nBranches merged.")
}

console.log("\nAll done.")
