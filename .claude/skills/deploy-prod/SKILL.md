---
name: deploy-prod
description: Open the release PR from `main` to `prod`, with a description that groups the merged PRs into the real changes they deliver. Use when the user invokes `/deploy-prod` or asks to deploy, release, or open the main → prod PR.
---

# deploy-prod

Run the scripts in this order, from the repo root. Do not run other commands, except `gh issue view` in step 2.

## 1. List the PRs to release

```bash
.claude/skills/deploy-prod/scripts/list-prs.sh
```

It prints one line per PR in `main` that is not in `prod`, newest first:

```markdown
https://github.com/hemilabs/ui-monorepo/pull/2379 | Decide which epoch pot the stake calculator prices against | branch: ad_2368-calculator-hooks | refs: https://github.com/hemilabs/ui-monorepo/issues/2368
https://github.com/hemilabs/ui-monorepo/pull/2375 | Estimate veHEMI fees before the HEMI approve | branch: ad_2356-stake-fee-approve | closes: https://github.com/hemilabs/ui-monorepo/issues/2356 (Hemi Stake gas fee shows "-" when an approval is needed)
```

`closes` lists the issues that the PR closes, with their titles. `refs` lists the other issues and PRs that its description mentions. All issues and PRs are full URLs, because some are in other repositories.

If it exits with an error, show the error to the user and stop. If it prints a warning, show the warning to the user.

## 2. Group the PRs into changes

The goal: a reader of the PR description knows which changes go to production. A change is one thing that a user or developer gets from the release. Group the PRs into changes on a best-effort basis. Some signs that PRs are one change:

- They close or refer to the same issue.
- One PR refers to another PR in the list.
- They work toward the same result, for example the branches `ad_2368-positions-calculator-math`, `ad_2368-epoch-rewards-reads` and `ad_2368-calculator-hooks`.

These signs are not rules. A PR can mention a new issue for follow-up work, or a PR that gave an idea, and these do not make it part of the same change. For example, many dependency bumps refer to the same tracking issue, but each bump is its own change. If you do not know what a `refs` issue is about, read its title with `gh issue view <url> --json title -q .title`.

Write each change as one short line in imperative mood, then the PRs that deliver it as `#<number>`. Include every PR exactly once. Put each change in one of these sections, in this order, and omit empty sections:

- **Features**: new or changed behavior for users of the portal, or for developers that use the packages or the portal-backend API.
- **Bug fixes**: corrections of wrong behavior.
- **Chores**: all other changes, for example tests, refactors, docs, tooling, Docker images, and dependencies.

## 3. Create the PR

Pass the description on stdin:

```bash
.claude/skills/deploy-prod/scripts/create-pr.sh <<'EOF'
### Features

- Add the Hemi Stake positions calculator (#2371, #2377, #2379)
- Let the portal run as a Safe App (#2363)

### Bug fixes

- Estimate veHEMI fees before the HEMI approve (#2375)

### Chores

- Migrate the token prices and vaults monitor crons to TypeScript (#2349, #2350)
- Bump vitest to 5.0.1 (#2391)
EOF
```

The script creates the PR titled `Deploy <YYYY-MM-DD>` and prints its URL. If a main → prod PR is already open, `gh` shows an error with the URL of that PR. Show the URL to the user.
