# Publish Template Repo

Use this file to publish the local template repo to GitHub before the author arrives.

## Goal

Create a public GitHub repository named `novel-production-template` and mark it as a template repository.

## Local Repo

[`/Users/johnliddy/Desktop/Projects/novel-production-template`](/Users/johnliddy/Desktop/Projects/novel-production-template)

## Commands

From the local template repo:

```bash
cd /Users/johnliddy/Desktop/Projects/novel-production-template
git status
git add .
git commit -m "Initial novel production template"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/novel-production-template.git
git push -u origin main
```

## GitHub UI Steps

1. Create a new public repository named `novel-production-template`
2. Do not initialize it with a README if you already committed locally
3. Push the local repo
4. Open the repository on GitHub
5. Go to repository `Settings`
6. Enable `Template repository`

## After Publishing

Share these with the author:

- the public GitHub template URL
- the arrival prompt in `prompts/FRIEND_ARRIVAL_PROMPT.md`
- the setup guide in `SETUP_AND_HANDOFF.md`
