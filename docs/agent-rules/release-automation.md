# Release & Automation

## Semantic Release

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) for automated versioning and changelog generation.

## Conventional Commits

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type       | Release | Description                                      |
| ---------- | ------- | ------------------------------------------------ |
| `feat`     | Minor   | New feature                                      |
| `fix`      | Patch   | Bug fix                                          |
| `docs`     | None    | Documentation only                               |
| `style`    | None    | Code style (formatting, no logic change)         |
| `refactor` | None    | Code change that neither fixes nor adds features |
| `perf`     | Patch   | Performance improvement                          |
| `test`     | None    | Adding or updating tests                         |
| `chore`    | None    | Maintenance tasks                                |

### Breaking Changes

Add `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```
feat!: remove deprecated API

BREAKING CHANGE: The `oldMethod()` has been removed. Use `newMethod()` instead.
```
