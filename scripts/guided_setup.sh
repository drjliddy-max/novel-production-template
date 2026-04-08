#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${HOME}/Desktop/Projects"
TEMPLATE_REPO_DEFAULT=""
BOOK_REPO_NAME="${BOOK_REPO_NAME:-}"
BOOK_REPO_DESC="${BOOK_REPO_DESC:-Private manuscript production repo}"
INSTALL_CLAUDE="${INSTALL_CLAUDE:-1}"
TEMPLATE_REPO="${TEMPLATE_REPO:-$TEMPLATE_REPO_DEFAULT}"

pause_for_user() {
  local message="$1"
  echo
  echo "============================================================"
  echo "$message"
  echo "Press Enter to continue when this step is complete."
  echo "============================================================"
  read -r
}

require_value() {
  local var_name="$1"
  local prompt="$2"
  local current="${!var_name:-}"
  if [ -n "$current" ]; then
    return
  fi
  echo "$prompt"
  read -r value
  if [ -z "$value" ]; then
    echo "A value is required."
    exit 1
  fi
  printf -v "$var_name" '%s' "$value"
}

check_os() {
  if [ "$(uname -s)" != "Darwin" ]; then
    echo "This script is intended for macOS."
    exit 1
  fi
}

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  fi
}

run_bootstrap() {
  echo "Running machine bootstrap"
  BOOK_REPO_NAME="$BOOK_REPO_NAME" INSTALL_CLAUDE="$INSTALL_CLAUDE" "$ROOT_DIR/scripts/bootstrap_mac.sh"
}

github_auth() {
  echo "Checking GitHub authentication"
  if gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI is already authenticated"
    return
  fi

  open_url "https://github.com/signup"
  pause_for_user "Create or sign in to the author's GitHub account in the browser."
  gh auth login
}

create_private_repo_from_template() {
  require_value TEMPLATE_REPO "Enter the public template repository in owner/name format:"
  require_value BOOK_REPO_NAME "Enter the new private repository name for this book:"

  if gh repo view "$(gh api user -q .login)/$BOOK_REPO_NAME" >/dev/null 2>&1; then
    echo "Private repo already exists: $BOOK_REPO_NAME"
    return
  fi

  echo "Creating private repository from template"
  gh repo create "$BOOK_REPO_NAME" \
    --private \
    --template "$TEMPLATE_REPO" \
    --description "$BOOK_REPO_DESC" \
    --clone=false
}

clone_private_repo() {
  local login
  login="$(gh api user -q .login)"
  mkdir -p "$PROJECTS_DIR"
  cd "$PROJECTS_DIR"

  if [ -d "$PROJECTS_DIR/$BOOK_REPO_NAME/.git" ]; then
    echo "Repo already cloned at $PROJECTS_DIR/$BOOK_REPO_NAME"
    return
  fi

  gh repo clone "$login/$BOOK_REPO_NAME" "$BOOK_REPO_NAME"
}

open_project() {
  cd "$PROJECTS_DIR/$BOOK_REPO_NAME"
  if command -v code >/dev/null 2>&1; then
    code .
  else
    echo "VS Code 'code' command not found."
    echo "Open VS Code and install the shell command from the Command Palette if needed."
  fi
}

codex_auth_pause() {
  open_url "https://platform.openai.com/"
  pause_for_user "Sign in to Codex/OpenAI on this machine. If Codex CLI needs login, complete it now."
}

claude_auth_pause() {
  if [ "$INSTALL_CLAUDE" != "1" ]; then
    return
  fi
  open_url "https://console.anthropic.com/"
  pause_for_user "If using Claude Code, sign in to Anthropic on this machine now."
}

manuscript_pause() {
  pause_for_user "Place the manuscript PDF into input/original-manuscript.pdf inside the cloned repo."
}

show_next_prompt() {
  echo
  echo "Next step:"
  echo "Open prompts/FIRST_RUN_CODEX_PROMPT.md in the cloned repo and paste it into Codex."
  echo "Repo location: $PROJECTS_DIR/$BOOK_REPO_NAME"
}

check_os
run_bootstrap
github_auth
create_private_repo_from_template
clone_private_repo
open_project
codex_auth_pause
claude_auth_pause
manuscript_pause
show_next_prompt
