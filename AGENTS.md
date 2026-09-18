# Project instructions

* Prefer duplication over abstraction.
* Prefer early returns over nesting.
* Avoid ternary operators.
* Prefer mutation over nesting.
* Avoid verbosity in feedback messages.

# Focused repository work

* Use the architecture map in README.md to select files before searching.
* Start with scoped searches. Use broad searches only for initial discovery, then narrow subsequent searches to relevant files and directories.
* Prefer targeted searches with small context windows, such as `rg -n -C 2`, and bounded file reads over reading large files in full.
* Avoid rereading unchanged files unless additional context is required.
* Exclude lockfiles, generated output, and image/SVG assets from routine searches; inspect them only when relevant. Keep package-lock.json committed.
* Example source search: `rg -n "pattern" client server locales enumerators types.d.ts`.
* Keep forms and dialogs in feature-specific components; prefer local duplication over generic CRUD abstractions.
* Before inspecting a large diff, use `git status`, `git diff --stat`, or `git diff --name-only`, then inspect only relevant files or hunks.
* Use non-mutating checks: `npm run lint`, `npm run typecheck`, and `npm run format:check -- <changed-files>`.
* Format only changed files with `npm run format -- <changed-files>`.
* Use `npm run build` to validate client and SSR bundles when relevant.
* Keep successful validation output concise when possible; inspect detailed output when a command fails.
* Do not reduce validation to save tokens.
* Before running a potentially high-output command, consider whether a narrower command would provide enough information.
* After completing a task, suggest a concise Git commit message.

Preferred workflow:

`discover → narrow → inspect relevant context → edit → targeted verification → final validation`

Optimize unnecessary context, not correctness. Large edits are acceptable when they directly implement the requested change.
