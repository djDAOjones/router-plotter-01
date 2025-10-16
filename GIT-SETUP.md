# Git Repository Setup Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right → "New repository"
3. Set repository name: `router-plotter-01`
4. Choose visibility (Public or Private)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Initialize Local Git Repository

Open your terminal and navigate to the project directory, then run:

```bash
cd "/Users/joe/Library/CloudStorage/OneDrive-TheUniversityofNottingham/_Joe Bell UoN Files/2_Projects/2025-10-14 Gary Priestnall PARM Maps Encore/Windsurf Map Router"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Route Plotter web application

- Complete HTML/CSS/JS implementation
- Image upload and display
- Waypoint management with annotations
- Smooth route rendering with Catmull-Rom curves
- Animation system with easing
- Playback controls
- Export/Import functionality (JSON/CSV)
- Video export capability
- Responsive design"
```

## Step 3: Connect to GitHub Repository

After creating the repository on GitHub, connect your local repository:

```bash
# Add remote repository
git remote add origin https://github.com/djDAOjones/router-plotter-01.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Verify

Visit your repository at:
https://github.com/djDAOjones/router-plotter-01

You should see all your files committed!

## Future Git Workflow

After making changes:

```bash
# Check status
git status

# Add changed files
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Troubleshooting

### Authentication Issues
If prompted for credentials, you may need to:
1. Use a Personal Access Token instead of password
2. Or configure SSH keys

### OneDrive Sync
Since your project is in OneDrive, be aware:
- OneDrive may sync the `.git` folder (this is fine)
- Avoid working on the same files across multiple devices simultaneously
- Let OneDrive finish syncing before switching devices

## Recommended Next Steps

1. Create a GitHub Pages deployment (optional)
2. Add contribution guidelines
3. Create issues for future enhancements
4. Consider adding GitHub Actions for CI/CD
