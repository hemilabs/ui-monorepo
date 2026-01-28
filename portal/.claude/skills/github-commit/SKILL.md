---
model: haiku
name: github-commit
description: Create a well-formatted git commit following best practices
---

# Git Commit Skill

When this skill is invoked, create a git commit following these steps:

## Instructions

1. **Check git status** to see what files are staged/unstaged
2. **Review the changes** using `git diff` (or `git diff --staged` if files are already staged)
3. **Stage files if needed** with `git add`
4. **Create the commit** following the guidelines below

## Commit Message Guidelines

- **Title**: Imperative mood, max 50 characters (e.g., "Add feature" not "Added feature")
- **Style**: Casual and human, but professional
- **Language**: Always in English
- **Format**:
  - Short title describing the change
  - If more context is needed, add a blank line followed by a commit body with further clarifications

## Important Notes

- Be specific but concise
- Focus on _what_ and _why_, not _how_
- Use commit body for larger explanations when the title isn't enough
- No need for issue numbers unless critical
- Avoid generic messages like "fix bug" or "update code"
