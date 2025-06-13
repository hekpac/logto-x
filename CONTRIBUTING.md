# Contributing to Logto

Thank you for helping improve Logto! The following commands will get you up and running with the monorepo.

## Install dependencies

Use `pnpm` to install all workspace packages:

```bash
pnpm i
```

## Run tests

Execute the workspace test script:

```bash
pnpm ci:test
```

## Lint code

Check code quality and styles with:

```bash
pnpm ci:lint
pnpm ci:stylelint
```

## Start development servers

Start the local development environment:

```bash
pnpm dev
```

This watches for changes across packages and restarts services when needed. You can also run `pnpm dev:cloud` to start the cloud variant.
