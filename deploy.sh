#!/bin/bash
# ─────────────────────────────────────────────────────
#  Moksha Tracker — Auto-Deploy to Render
#  Usage:  ./deploy.sh              (quick deploy)
#          ./deploy.sh "commit msg"  (custom message)
#          ./deploy.sh --setup       (first-time setup)
# ─────────────────────────────────────────────────────

set -e

# ── colours ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✔${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✖${NC} $1"; exit 1; }

# ── First-time setup ──
if [[ "$1" == "--setup" ]]; then
  echo -e "\n${BOLD}🔧  Render Deploy Setup${NC}\n"
  
  echo "To enable auto-deploy, you need a Render Deploy Hook URL."
  echo "Steps:"
  echo "  1. Go to https://dashboard.render.com"
  echo "  2. Select your 'moksha-tracker' service"
  echo "  3. Go to Settings → Build & Deploy → Deploy Hook"
  echo "  4. Copy the deploy hook URL"
  echo ""
  read -p "Paste your Render Deploy Hook URL: " HOOK_URL
  
  if [[ -z "$HOOK_URL" ]]; then
    fail "No URL provided. Run ./deploy.sh --setup again."
  fi

  # Save deploy hook to .env.local (git-ignored)
  if grep -q "RENDER_DEPLOY_HOOK" .env.local 2>/dev/null; then
    sed -i '' "s|RENDER_DEPLOY_HOOK=.*|RENDER_DEPLOY_HOOK=${HOOK_URL}|" .env.local
  else
    echo "RENDER_DEPLOY_HOOK=${HOOK_URL}" >> .env.local
  fi

  ok "Deploy hook saved to .env.local"
  echo -e "\nYou can now run ${BOLD}./deploy.sh${NC} to deploy!\n"
  exit 0
fi

# ── Load deploy hook ──
if [[ -f .env.local ]]; then
  RENDER_HOOK=$(grep "RENDER_DEPLOY_HOOK" .env.local 2>/dev/null | cut -d'=' -f2-)
fi

echo ""
echo -e "${BOLD}🚀  Moksha Tracker — Auto Deploy${NC}"
echo "───────────────────────────────────"

# ── Step 1: Build check ──
log "Building project..."
if npm run build > /dev/null 2>&1; then
  ok "Build succeeded"
else
  fail "Build failed! Fix errors before deploying."
fi

# ── Step 2: Git status ──
if [[ -z $(git status --porcelain) ]]; then
  warn "No changes to commit — pushing existing commits"
else
  COMMIT_MSG="${1:-auto-deploy: $(date '+%Y-%m-%d %H:%M')}"
  log "Staging changes..."
  git add .
  ok "Changes staged"
  
  log "Committing: ${COMMIT_MSG}"
  git commit -m "$COMMIT_MSG" --quiet
  ok "Committed"
fi

# ── Step 3: Push to GitHub ──
log "Pushing to GitHub..."
if git push origin main --quiet 2>/dev/null; then
  ok "Pushed to origin/main"
else
  fail "Push failed! Check your git remote."
fi

# ── Step 4: Trigger Render deploy ──
if [[ -n "$RENDER_HOOK" ]]; then
  log "Triggering Render deploy..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_HOOK")
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    ok "Render deploy triggered!"
  else
    warn "Deploy hook returned HTTP $HTTP_CODE (Render may still auto-deploy from GitHub)"
  fi
else
  warn "No Render deploy hook configured. Render will auto-deploy if connected to GitHub."
  echo -e "   Run ${BOLD}./deploy.sh --setup${NC} to add a deploy hook for instant deploys."
fi

# ── Done ──
echo ""
echo -e "${GREEN}${BOLD}✅  Deploy complete!${NC}"
echo "───────────────────────────────────"
if [[ -n "$RENDER_HOOK" ]]; then
  echo -e "   Your site will be live in ~1-2 minutes."
else
  echo -e "   If Render is connected to GitHub, it will auto-deploy."
  echo -e "   Otherwise, run ${BOLD}./deploy.sh --setup${NC} to configure."
fi
echo ""
