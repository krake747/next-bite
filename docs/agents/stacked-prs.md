# Stacked PRs

Read this when a change splits into a chain of dependent pull requests.

A stack is an ordered chain of PRs where each layer targets the branch below it, so each PR shows
only its own diff. Layers merge bottom-up. GitHub renders the chain as a stack map.

## With `gh stack`

GitHub's extension manages the chain and the PR bases:

```bash
gh extension install github/gh-stack   # once
gh stack init <first-branch>           # bottom branch off main
gh stack add <next-branch>             # each next layer
gh stack submit                        # push branches and open the linked PRs
gh stack view                          # every layer with PR status
gh stack merge                         # merge the stack bottom-up
```

For PRs that already exist, link them without local tracking:

```bash
gh stack link <bottom-pr> <middle-pr> <top-pr>
```

`link` sets each PR base to the branch below it. `gh stack view` flags a layer that needs a rebase;
`gh stack rebase` rewrites the chain and force-pushes it. `gh stack unstack` removes the local and
GitHub stack.

## Manual

Set each PR base to the branch below it: `gh pr edit <n> --base <branch>`, or the base selector in
the PR header. Merge bottom-up; GitHub retargets the children as lower layers land.

## Squash merges

Squash-merging the bottom layer leaves the next layer conflicting, because its branch still holds
the pre-squash commits. Merge `main` into the child and keep the child side, since it already
contains both layers, or let `gh stack rebase` rewrite the chain.
