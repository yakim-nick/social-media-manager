# Contributing to social-media-manager

Thanks for contributing! This is a full-stack app (Node/Express + React) for
managing social media content, so keep the API and frontend layers clean and
tested.

## Getting started

```sh
make install     # install backend + frontend deps
make dev         # run the stack in watch mode (see Makefile targets)
```

## Before you open a PR

- Run `make test` (backend and frontend suites) and `make lint`/`make build`.
- Keep secrets out of the repo — use the `.env` file (gitignored) or a secret
  manager. Never commit real credentials or tokens.
- Follow the existing folder conventions for backend controllers/routes and
  frontend components.

## Commits

Use conventional-commits style, e.g. `feat(scheduler): ...`,
`fix(auth): ...`, `docs(api): ...`.

## Reaching out

Open an issue to discuss bugs, feature ideas, or large changes before
submitting a PR.
