# Repository Setup Guide

This document outlines the required GitHub repository configuration for the Finance Manager project, including branch protection rules, secrets, and environment settings needed for the CI/CD pipeline.

## Table of Contents

- [Branch Protection Rules](#branch-protection-rules)
- [Required Secrets](#required-secrets)
- [Environment Configuration](#environment-configuration)
- [GitHub Settings](#github-settings)
- [Security Configuration](#security-configuration)
- [Deployment Configuration](#deployment-configuration)

## Branch Protection Rules

### Main Branch Protection

Configure the following rules for the `main` branch:

#### Required Status Checks

Enable "Require status checks to pass before merging" with these required checks:

- `CI / Setup & Validation`
- `CI / Lint Code (OxLint)`
- `CI / Type Check (packages)`
- `CI / Type Check (worker)`
- `CI / Type Check (web)`
- `CI / Test (core)`
- `CI / Test (ai)`
- `CI / Test (db)`
- `CI / Integration Tests`
- `CI / Build Validation`
- `Security / Dependency Audit`
- `Security / GitHub Security Analysis`
- `Security / Secret Scanning`

#### Enforcement Settings

- ✅ **Require branches to be up to date before merging**
- ✅ **Require pull request reviews before merging**
  - Required number of reviewers: **1**
  - ✅ Dismiss stale reviews when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)
- ✅ **Require signed commits**
- ✅ **Require linear history**
- ✅ **Include administrators** (applies rules to admins too)
- ✅ **Restrict pushes that create files over 100MB**

#### Additional Rules

- ✅ **Allow squash merging**
- ❌ Allow merge commits
- ❌ Allow rebase merging
- ✅ **Automatically delete head branches**

### Develop Branch Protection (Optional)

If using a `develop` branch, configure similar rules but with relaxed requirements:

- Required status checks: CI pipeline only
- Required reviewers: 0 (allow self-merge for development)
- Allow force pushes from maintainers

## Required Secrets

### Repository Secrets

Configure these secrets in **Settings → Secrets and Variables → Actions**:

#### Cloudflare Configuration

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

#### Security Scanning (Optional but Recommended)

```
SNYK_TOKEN                    # For Snyk vulnerability scanning
LHCI_GITHUB_APP_TOKEN        # For Lighthouse CI performance monitoring
```

#### Notifications (Optional)

```
SLACK_WEBHOOK_URL            # For deployment notifications
```

### Environment Secrets

For each environment (staging, production), configure:

#### Staging Environment

```
CLOUDFLARE_API_TOKEN         # Same as repository secret
CLOUDFLARE_ACCOUNT_ID        # Same as repository secret
```

#### Production Environment

```
CLOUDFLARE_API_TOKEN         # Same as repository secret
CLOUDFLARE_ACCOUNT_ID        # Same as repository secret
```

### How to Obtain Secrets

#### Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile → API Tokens**
3. Click **Create Token**
4. Use **Custom token** with these permissions:
   - **Zone:Zone Settings:Read**
   - **Zone:Zone:Read**
   - **Account:Cloudflare Workers:Edit**
   - **Account:Page Rules:Edit**
5. Include specific account and zone resources
6. Copy the generated token

#### Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Find **Account ID** in the right sidebar
4. Copy the Account ID

#### Snyk Token (Optional)

1. Sign up at [Snyk.io](https://snyk.io/)
2. Go to **Account Settings → API Token**
3. Generate and copy the token

## Environment Configuration

### Staging Environment

Configure in **Settings → Environments → staging**:

#### Protection Rules

- ✅ **Required reviewers**: None (allow automatic deployment)
- ⏱️ **Wait timer**: 0 minutes
- 🌍 **Deployment branches**: Selected branches (`main`, `develop`)

#### Environment Secrets

- Add `CLOUDFLARE_API_TOKEN`
- Add `CLOUDFLARE_ACCOUNT_ID`

#### Environment Variables

```
ENVIRONMENT=staging
LOG_LEVEL=debug
```

### Production Environment

Configure in **Settings → Environments → production**:

#### Protection Rules

- ✅ **Required reviewers**: 1 (manual approval required)
- ⏱️ **Wait timer**: 5 minutes (cooling-off period)
- 🌍 **Deployment branches**: Selected branches (`main` only)

#### Environment Secrets

- Add `CLOUDFLARE_API_TOKEN`
- Add `CLOUDFLARE_ACCOUNT_ID`

#### Environment Variables

```
ENVIRONMENT=production
LOG_LEVEL=warn
```

## GitHub Settings

### General Repository Settings

Navigate to **Settings → General**:

#### Features

- ✅ **Wikis**: Enabled
- ✅ **Issues**: Enabled
- ✅ **Sponsorships**: Disabled
- ✅ **Preserve this repository**: Enabled
- ✅ **Discussions**: Enabled

#### Pull Requests

- ✅ **Allow merge commits**: Disabled
- ✅ **Allow squash merging**: Enabled
- ✅ **Allow rebase merging**: Disabled
- ✅ **Always suggest updating pull request branches**: Enabled
- ✅ **Allow auto-merge**: Enabled
- ✅ **Automatically delete head branches**: Enabled

#### Archives

- ✅ **Include Git LFS objects in archives**: Enabled

### Code Security and Analysis

Navigate to **Settings → Code security and analysis**:

#### Dependency Graph

- ✅ **Enable dependency graph**: Enabled

#### Dependabot

- ✅ **Dependabot alerts**: Enabled
- ✅ **Dependabot security updates**: Enabled
- ✅ **Dependabot version updates**: Enabled (configure with `.github/dependabot.yml`)

#### Code Scanning

- ✅ **CodeQL analysis**: Enabled (configured via workflow)

#### Secret Scanning

- ✅ **Secret scanning**: Enabled
- ✅ **Push protection**: Enabled

## Security Configuration

### Advanced Security Features

If you have GitHub Advanced Security:

#### Secret Scanning

- ✅ Enable secret scanning for all supported secret types
- ✅ Configure custom patterns for API keys specific to your project
- ✅ Enable push protection to prevent secrets from being committed

#### Code Scanning

- ✅ Enable CodeQL for JavaScript/TypeScript
- ✅ Configure custom queries for framework-specific vulnerabilities
- ✅ Set up automated security updates

#### Dependency Review

- ✅ Enable dependency review for pull requests
- ✅ Configure vulnerability alerts
- ✅ Set up automated dependency updates

### Third-Party Integrations

#### Snyk Integration (Recommended)

1. Install the [Snyk GitHub App](https://github.com/apps/snyk-io)
2. Configure repository access
3. Enable pull request checks
4. Set up automated vulnerability monitoring

#### Lighthouse CI (Optional)

1. Install [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
2. Configure performance budgets
3. Enable automated performance monitoring

## Deployment Configuration

### Cloudflare Workers Setup

#### Worker Configuration

1. Create staging worker: `finance-manager-staging`
2. Create production worker: `finance-manager`
3. Configure custom domains (if available)
4. Set up environment variables in Cloudflare Dashboard

#### Wrangler Configuration

Ensure `wrangler.toml` is properly configured:

```toml
name = "finance-manager"
compatibility_date = "2024-12-20"
node_compat = true

[env.staging]
name = "finance-manager-staging"
compatibility_date = "2024-12-20"

[env.production]
name = "finance-manager"
compatibility_date = "2024-12-20"
```

### Domain Configuration (Optional)

If using custom domains:

#### Staging Domain

- Subdomain: `staging.finance-manager.yourdomain.com`
- Configure DNS in Cloudflare
- Update deployment workflow URLs

#### Production Domain

- Domain: `finance-manager.yourdomain.com` or `yourdomain.com`
- Configure DNS in Cloudflare
- Update deployment workflow URLs

## Verification Checklist

Use this checklist to verify your repository is properly configured:

### ✅ Branch Protection

- [ ] Main branch protection rules enabled
- [ ] Required status checks configured
- [ ] Pull request reviews required
- [ ] Signed commits enforced

### ✅ Secrets Configuration

- [ ] Cloudflare API token added
- [ ] Cloudflare Account ID added
- [ ] Optional security tokens configured
- [ ] Environment secrets properly set

### ✅ Environments

- [ ] Staging environment configured
- [ ] Production environment configured
- [ ] Protection rules applied
- [ ] Environment variables set

### ✅ Security Features

- [ ] Dependabot enabled
- [ ] Secret scanning enabled
- [ ] CodeQL analysis configured
- [ ] Vulnerability alerts enabled

### ✅ CI/CD Pipeline

- [ ] CI workflow runs successfully
- [ ] E2E tests execute properly
- [ ] Security scans complete
- [ ] Deployment workflow functions
- [ ] All required checks pass

## Troubleshooting

### Common Issues

#### CI/CD Pipeline Failures

1. **Missing secrets**: Verify all required secrets are configured
2. **Permission errors**: Check API token permissions
3. **Outdated dependencies**: Run Dependabot updates
4. **Test failures**: Review test logs and fix issues

#### Deployment Issues

1. **Cloudflare authentication**: Verify API token and Account ID
2. **Worker limits**: Check Cloudflare plan limits
3. **Domain configuration**: Verify DNS settings
4. **Environment variables**: Check staging vs production config

#### Security Scan Failures

1. **Dependency vulnerabilities**: Update vulnerable packages
2. **Secrets detected**: Remove committed secrets, rotate keys
3. **License issues**: Review and update package licenses
4. **Code quality**: Address CodeQL findings

### Getting Help

- 📖 **GitHub Docs**: [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- 🔧 **Cloudflare Workers**: [Workers Documentation](https://developers.cloudflare.com/workers/)
- 🛡️ **Security Best Practices**: [GitHub Security](https://docs.github.com/en/code-security)
- 🚀 **GitHub Actions**: [Workflow Documentation](https://docs.github.com/en/actions)

---

**Note**: This configuration ensures a secure, reliable, and automated development workflow. Adjust settings based on your team's specific needs and security requirements.
