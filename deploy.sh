#!/bin/bash
echo "🚀 Preparing to auto-deploy your changes to Render..."

git add .
git commit -m "Auto-deploy update from local machine"
git push origin main

echo "✅ Changes pushed to GitHub! Render is now deploying your website."
