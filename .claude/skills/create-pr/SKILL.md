---
name: create-pr
description: Create a GitHub PR with `gh pr create` using this repo's standard template (Description / What did you do? / What to watch out for?). Use when the user asks to open, create, or file a pull request.
---

# Create PR

1. Confirm the branch is pushed: `git push -u origin HEAD` (ask first if it hasn't been pushed yet — pushing is visible to others).
2. Look at what's actually in the PR: `git log <base>..HEAD --oneline` and `git diff <base>...HEAD`.
3. Find the issue this PR closes: `gh issue list --search "<keywords from branch name / commits>"` (also try `gh issue list --state open`). If exactly one open issue clearly matches, use it. If several plausibly match or none do, ask the user which issue (if any) this closes — don't guess.
4. Fill out the template below from that diff — don't leave placeholder bullets in. Drop "What to watch out for?" entirely if there's nothing to flag (it's optional). If an issue was identified, add a `Closes #<number>` line at the top of the Description — GitHub's native closing-keyword linking attaches the PR to the issue and closes it automatically on merge.
5. Create the PR with the body passed via heredoc so formatting survives:

```bash
gh pr create --title "<short title>" --body "$(cat <<'EOF'
## Description

Closes #<issue-number>

- ...

## What did you do?

### <Topic>

- ...

## What to watch out for?

- ...
EOF
)"
```

6. Show the user the returned PR URL. Never use `--web` unless asked, and never force-push or edit an existing PR's branch without confirming first.
