# autofix.ci Setup Instructions

This repository uses [autofix.ci](https://autofix.ci) to automatically fix code quality issues in pull requests.

## Installation

To complete the setup of autofix.ci for this repository:

### 1. Install the GitHub App

**Repository maintainers** need to install the autofix.ci GitHub App:

1. Go to https://github.com/apps/autofix-ci
2. Click "Install" or "Configure"
3. Select this repository (`irfndi/fin-in-flow`)
4. Grant the necessary permissions

The app is required because GitHub Actions cannot update pull requests from forks for security reasons. The autofix.ci app provides the minimal required permissions to securely apply fixes.

### 2. Verify Workflow Configuration

The GitHub Actions workflow is already configured at `.github/workflows/autofix.yml`. This workflow:

- Runs on all pull requests and pushes to main/develop branches
- Installs dependencies with PNPM
- Runs OxLint with auto-fix enabled
- Applies any fixes automatically via autofix.ci

## How It Works

1. When a pull request is opened or updated, the workflow runs
2. Code quality tools (OxLint) scan and fix issues automatically
3. If fixes are applied, autofix.ci commits them back to the PR branch
4. The PR is automatically updated with the fixes

## Supported Tools

Currently configured:
- **OxLint**: Fast JavaScript/TypeScript linter with auto-fix

## Security

- The autofix.ci action is pinned to a specific commit hash for supply chain security
- Only the autofix.ci app has permission to update pull requests
- No personal access tokens or unsafe GitHub Actions permissions are required

## Documentation

- Setup guide: https://autofix.ci/setup
- Security info: https://autofix.ci/security
- GitHub App: https://github.com/apps/autofix-ci
