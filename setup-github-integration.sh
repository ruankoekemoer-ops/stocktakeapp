#!/bin/bash
# Setup GitHub integration for automated operations

set -e

echo "🔗 Setting up GitHub Integration..."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "📦 Installing GitHub CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo "⚠️  Homebrew not found. Install GitHub CLI manually:"
            echo "   Visit: https://cli.github.com/"
            exit 1
        fi
    else
        echo "⚠️  Please install GitHub CLI manually:"
        echo "   Visit: https://cli.github.com/"
        exit 1
    fi
else
    echo "✅ GitHub CLI is already installed"
fi

# Authenticate with GitHub
echo ""
echo "🔐 Authenticating with GitHub..."
echo "   This will open your browser to authenticate..."
gh auth login

# Set up Git credential helper
echo ""
echo "🔧 Setting up Git credential helper..."
git config --global credential.helper store

# Store GitHub token securely
if [ -n "$GITHUB_TOKEN" ]; then
    echo "💾 Storing GitHub token securely..."
    echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
    echo "✅ Token stored in ~/.git-credentials"
else
    echo "⚠️  GITHUB_TOKEN not set. You can set it with:"
    echo "   export GITHUB_TOKEN=your_token_here"
fi

# Configure Git user (if not already set)
echo ""
echo "👤 Configuring Git user..."
read -p "GitHub username (ruankoekemoer-ops): " GIT_USER
GIT_USER=${GIT_USER:-ruankoekemoer-ops}

read -p "GitHub email (rkoekemoer@masterdrilling.com): " GIT_EMAIL
GIT_EMAIL=${GIT_EMAIL:-rkoekemoer@masterdrilling.com}

git config --global user.name "$GIT_USER"
git config --global user.email "$GIT_EMAIL"

echo ""
echo "✅ GitHub integration setup complete!"
echo ""
echo "You can now use:"
echo "  - gh repo clone <repo>"
echo "  - gh repo create"
echo "  - git push/pull (authenticated)"
echo "  - Automated scripts can use GITHUB_TOKEN"

