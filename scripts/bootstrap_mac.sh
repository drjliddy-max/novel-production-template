#!/bin/bash
set -euo pipefail

PROJECTS_DIR="${HOME}/Desktop/Projects"
INSTALL_CLAUDE="${INSTALL_CLAUDE:-1}"
BOOK_REPO_NAME="${BOOK_REPO_NAME:-}"

echo "Novel Production Mac Bootstrap"
echo "=============================="

ensure_command() {
  local cmd="$1"
  local help_text="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    echo "$help_text"
    exit 1
  fi
}

install_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    echo "Homebrew already installed"
    return
  fi

  echo "Installing Homebrew"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

install_brew_packages() {
  echo "Installing base packages"
  brew install git pandoc poppler python node gh

  echo "Installing VS Code"
  brew install --cask visual-studio-code
}

install_ai_tools() {
  echo "Installing Codex"
  npm install -g @openai/codex

  if [ "$INSTALL_CLAUDE" = "1" ]; then
    echo "Installing Claude Code"
    npm install -g @anthropic-ai/claude-code
  else
    echo "Skipping Claude Code install"
  fi
}

create_workspace() {
  echo "Creating workspace at $PROJECTS_DIR"
  mkdir -p "$PROJECTS_DIR"

  if [ -n "$BOOK_REPO_NAME" ]; then
    mkdir -p "$PROJECTS_DIR/$BOOK_REPO_NAME"
    echo "Created placeholder project folder: $PROJECTS_DIR/$BOOK_REPO_NAME"
  fi
}

print_next_steps() {
  cat <<EOF

Bootstrap complete.

Manual steps still required:
1. Create or sign in to GitHub in the browser
2. Run: gh auth login
3. Create a new private repo from the GitHub template
4. Clone that private repo into: $PROJECTS_DIR
5. Put the manuscript PDF into the repo's input/ folder
6. Open the repo in VS Code
7. Sign in to Codex
8. Optionally sign in to Claude Code
9. Paste the first-run prompt from prompts/FIRST_RUN_CODEX_PROMPT.md

Helpful checks:
- git --version
- pandoc --version
- pdftotext -v
- node --version
- codex --help
- claude --help

EOF
}

install_homebrew
ensure_command brew "Homebrew installation did not complete successfully."
install_brew_packages
ensure_command npm "Node.js/npm installation failed."
install_ai_tools
create_workspace
print_next_steps
