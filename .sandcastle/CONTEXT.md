# Sandcastle

An autonomous AI agent loop that picks unblocked Linear issues, implements them with TDD, reviews
the code, and merges to main. The agent persona is named RALPH, after Geoffrey Huntley's
[ralph loop](https://ghuntley.com/loop/) — a monolithic orchestrator pattern that performs one task
per loop.

## Language

**RALPH**: The autonomous developer persona. His name appears on all git commits (`[RALPH]` prefix)
and as the git user. RALPH is the _who_; Sandcastle is the _what_. _Avoid_: Agent, bot, CI

**Sandcastle**: The system that runs RALPH — the Docker sandbox, the agent roles, the loop
orchestration, and the Linear/GitHub integration. _Avoid_: Pipeline, CI, runner

**Session**: A full `main.ts` execution from first cycle to exhaustion (no unblocked issues remain).
A Session contains multiple Cycles. _Avoid_: Run, job, build

**Cycle**: One pass through the Planner, discovering unblocked Issues to work on. Each Cycle
produces a Plan and then executes Runs for each Issue in that Plan. _Avoid_: Iteration, round, batch

**Run**: The implement → review → merge sequence for a single Issue. Each Run completes
independently; a fast Run does not wait for slow ones in the same Cycle. _Avoid_: Task, job,
pipeline

**Issue**: A Linear ticket that flows through the system. An Issue is the persistent identity that
accumulates artifacts: a branch, commits, a PR, and a merge. _Avoid_: Ticket, task, card

**Plan**: The Planner's output for a Cycle — a list of unblocked Issues, each assigned a branch name
and carrying its Linear labels. The Plan drives the Runs in that Cycle. _Avoid_: Queue, backlog,
batch

**Role**: A named stage in the loop with its own prompt, model, permissions, and sandbox lifecycle.
The four Roles are: Planner, Implementer, Reviewer, and Merger. _Avoid_: Stage, step, phase

**Agent**: The generic LLM execution entity that fills a Role. Each Role configures an Agent with
model selection, environment variables, and a prompt file. _Avoid_: Runner, worker

**Worktree**: A persistent Docker sandbox with a branch checkout, dependencies, and mutable code.
The Implementer and Reviewer share a Worktree within a Run. The Planner and Merger do not. _Avoid_:
Container, box, sandbox

**Dependency Graph**: The web of block relationships among open Issues. The Planner builds this each
Cycle to determine which Issues are unblocked. _Avoid_: Task graph, DAG

**Unblocked**: An Issue with zero blocking dependencies on other open Issues. Only unblocked Issues
enter a Plan. _Avoid_: Ready, available, free

**Blocked / Blocks**: A dependency relationship where Issue A _blocks_ Issue B when B requires code
or infrastructure that A introduces. B is _blocked by_ A. The Planner infers these from
descriptions, file overlap, and API dependencies. _Avoid_: Depends on, requires, prerequisite

**Branch Name**: A git branch following the `sandcastle/kra-{id-lowercase}-{slug}` convention,
assigned by the Planner. The slug is a short hyphenated form of the Issue title. Example:
`sandcastle/kra-42-fix-auth-bug`. _Avoid_: Ref, head

**Pull Request**: A GitHub PR created by the Merger during a Run. The title is the Issue ID (e.g.
`KRA-42`) and the body is a brief summary of the changes. Merged via squash into main and the branch
is deleted. _Avoid_: MR, merge request
