# 🔗 GitHub Integration Guide

This guide shows you how to connect your environment to GitHub so I can help you with GitHub operations.

## Option 1: GitHub CLI (Recommended)

The GitHub CLI (`gh`) provides the best integration for automated operations.

### Install GitHub CLI

**macOS:**
```bash
brew install gh
```

**Other platforms:**
Visit: https://cli.github.com/

### Authenticate

```bash
gh auth login
```

This will:
- Open your browser
- Let you authenticate with GitHub
- Store credentials securely

### Verify Installation

```bash
gh auth status
```

## Option 2: Git Credential Helper

Store your GitHub token securely for Git operations:

```bash
# Set your token as environment variable
export GITHUB_TOKEN=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

# Configure Git to use credential helper
git config --global credential.helper store

# Store token securely
echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

## Option 3: Environment Variables

Set up environment variables that scripts can use:

### Temporary (current session):
```bash
export GITHUB_TOKEN=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
export GITHUB_USERNAME=ruankoekemoer-ops
```

### Permanent (add to ~/.zshrc or ~/.bashrc):
```bash
echo 'export GITHUB_TOKEN=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' >> ~/.zshrc
echo 'export GITHUB_USERNAME=ruankoekemoer-ops' >> ~/.zshrc
source ~/.zshrc
```

## Quick Setup Script

I've created a setup script that does all of this:

```bash
cd "/Users/ruankoekemoer/Sharepoint Test"
chmod +x setup-github-integration.sh
./setup-github-integration.sh
```

## What This Enables

Once set up, I can help you with:

✅ **Git Operations**
- Push/pull code
- Create branches
- Merge changes
- View commit history

✅ **Repository Management**
- Create repositories
- Clone repositories
- Manage issues
- Create pull requests

✅ **Automated Workflows**
- CI/CD setup
- Automated deployments
- Release management

## Security Best Practices

1. **Never commit tokens** - Use environment variables or credential helpers
2. **Use fine-grained tokens** - Only grant necessary permissions
3. **Rotate tokens regularly** - Especially if exposed
4. **Use SSH keys** - More secure than HTTPS tokens for frequent use

## Verify Setup

```bash
# Check GitHub CLI
gh auth status

# Check Git credentials
git config --global credential.helper

# Test push (will use stored credentials)
git push
```

## Troubleshooting

### "Authentication failed"
- Re-run `gh auth login`
- Check token permissions in GitHub Settings > Developer settings > Personal access tokens

### "Permission denied"
- Ensure token has `repo` scope
- Check repository permissions

### "Command not found: gh"
- Install GitHub CLI: `brew install gh` (macOS)
- Or download from: https://cli.github.com/

## Next Steps

After setup, you can:
1. Push your code: `git push`
2. Create repos: `gh repo create`
3. Manage issues: `gh issue list`
4. Set up CI/CD: Create `.github/workflows/` directory

