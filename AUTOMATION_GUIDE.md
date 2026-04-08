# Automation Guide

This document explains which parts of the novel production setup can be automated and which parts still require human interaction.

## Short Answer

Yes, a large portion can be automated.

The best practical model is:

- automate software installation
- automate folder creation
- automate workspace scaffolding
- automate repo cloning after authentication
- automate manuscript import and export
- pause for account creation, billing, and login/authorization steps

## What Can Be Automated

- install Homebrew
- install Git
- install Pandoc
- install Poppler (`pdftotext`)
- install Python
- install Node.js
- install GitHub CLI
- install VS Code
- install Codex
- install Claude Code
- create `~/Desktop/Projects`
- create placeholder project folders
- clone repositories after GitHub authentication
- import the manuscript PDF into chapter files
- build DOCX and HTML exports

## What Usually Cannot Be Fully Automated

- creating a GitHub account
- verifying email
- entering payment or billing details
- agreeing to service terms
- signing in to Codex
- signing in to Claude Code
- creating an Amazon KDP account
- tax and banking setup in Amazon KDP
- final content disclosure answers
- final title and pricing decisions

These steps usually require browser-based login, MFA, or legal confirmation from the author.

## Current Bootstrap Script

Use:

[`scripts/bootstrap_mac.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/bootstrap_mac.sh)

It automates:

- Homebrew installation if missing
- package installation
- VS Code install
- Codex install
- optional Claude Code install
- `~/Desktop/Projects` creation

### Example

```bash
cd /path/to/novel-production-template
./scripts/bootstrap_mac.sh
```

Optional environment variables:

```bash
BOOK_REPO_NAME="my-book" INSTALL_CLAUDE=1 ./scripts/bootstrap_mac.sh
```

## Guided Setup Script

Use:

[`scripts/guided_setup.sh`](/Users/johnliddy/Desktop/Projects/novel-production-template/scripts/guided_setup.sh)

This is the closest thing to a start-to-finish operator script in the package.

It:

- runs the machine bootstrap
- pauses for GitHub sign-in
- authenticates GitHub CLI
- creates the private repo from the template
- clones the private repo into `~/Desktop/Projects`
- opens the repo in VS Code
- pauses for Codex and Claude authentication
- pauses for the author to place the manuscript PDF
- points you to the first-run prompt

Example:

```bash
cd /path/to/novel-production-template
TEMPLATE_REPO="yourname/novel-production-template" BOOK_REPO_NAME="my-book" ./scripts/guided_setup.sh
```

## Best Same-Day Flow

1. Run `bootstrap_mac.sh`
2. Or run `guided_setup.sh` for the full paused workflow
3. Complete GitHub sign-in manually
4. Complete Codex sign-in manually
5. Complete Claude Code sign-in manually if needed
6. Create or clone the private repo
7. Add the PDF
8. Run the first Codex prompt

## GitHub Automation Boundary

You can automate GitHub actions after authentication using `gh`, but not the initial account creation itself in a reliable, policy-safe way.

Good automation targets after login:

- `gh auth login`
- creating repos
- cloning repos
- setting repo visibility

## Amazon KDP Automation Boundary

You should not expect full KDP automation for first-time setup.

The author still needs to personally review and complete:

- account creation
- legal name and tax details
- banking/payment setup
- rights confirmations
- AI disclosure answers
- final pricing and territory choices

## Recommended Approach

Automate the machine and repo setup.
Keep identity, payment, legal, and final publication decisions human-controlled.
