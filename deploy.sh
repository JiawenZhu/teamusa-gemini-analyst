#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  Team USA Digital Mirror — Full Deploy Script
#
#  Usage:
#    ./deploy.sh                   → deploy all 3
#    ./deploy.sh --skip-backend    → skip backend, deploy frontend + firebase
#    ./deploy.sh --skip-frontend   → skip frontend, deploy backend + firebase
#    ./deploy.sh --skip-firebase   → skip firebase, deploy backend + frontend
#    ./deploy.sh --skip-backend --skip-frontend  → firebase only
# ═══════════════════════════════════════════════════════════

set -e  # Stop immediately if any step fails

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# ── Config ───────────────────────────────────────────────────
PROJECT="teamusa-8b1ba"
REGION="us-central1"
API_URL="https://teamusa-oracle-api-789615763226.us-central1.run.app"

# ── Parse flags ─────────────────────────────────────────────
SKIP_BACKEND=false
SKIP_FRONTEND=false
SKIP_FIREBASE=false

for arg in "$@"; do
  case $arg in
    --skip-backend)  SKIP_BACKEND=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-firebase) SKIP_FIREBASE=true ;;
    *)
      echo -e "${RED}Unknown flag: $arg${NC}"
      echo "Valid flags: --skip-backend  --skip-frontend  --skip-firebase"
      exit 1
      ;;
  esac
done

START_TIME=$(date +%s)

print_step() {
  echo ""
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${YELLOW}  $1${NC}"
  echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}${BOLD}  ✅ $1${NC}"
}

print_error() {
  echo -e "${RED}${BOLD}  ❌ $1${NC}"
}

# ── Header ──────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}${CYAN}  🏅 Team USA Digital Mirror — Deploy All${NC}"
echo -e "${CYAN}  Project: ${PROJECT} | Region: ${REGION}${NC}"
echo -e "${CYAN}  Skipping: $([ $SKIP_BACKEND = true ] && echo 'backend ') $([ $SKIP_FRONTEND = true ] && echo 'frontend ') $([ $SKIP_FIREBASE = true ] && echo 'firebase') ${NC}"
echo ""

# ═══════════════════════════════════════════════════════════
# STEP 1: Backend (FastAPI → Cloud Run)
# ═══════════════════════════════════════════════════════════
if [ "$SKIP_BACKEND" = true ]; then
  echo -e "${YELLOW}  ⏭  Skipping backend (--skip-backend)${NC}"
else
  print_step "Step 1/3 · Deploying Backend API (FastAPI → Cloud Run)"

  gcloud run deploy teamusa-oracle-api \
    --source ./backend \
    --region "$REGION" \
    --project "$PROJECT" \
    --allow-unauthenticated \
    --quiet

  print_success "Backend deployed → $API_URL"
fi

# ═══════════════════════════════════════════════════════════
# STEP 2: Frontend (Next.js → Cloud Run)
# ═══════════════════════════════════════════════════════════
if [ "$SKIP_FRONTEND" = true ]; then
  echo -e "${YELLOW}  ⏭  Skipping frontend (--skip-frontend)${NC}"
else
  print_step "Step 2/3 · Deploying Frontend (Next.js → Cloud Run)"

  gcloud run deploy teamusa-oracle-frontend \
    --source ./frontend \
    --region "$REGION" \
    --project "$PROJECT" \
    --allow-unauthenticated \
    --set-build-env-vars "NEXT_PUBLIC_API_URL=$API_URL" \
    --quiet

  print_success "Frontend deployed → Cloud Run"
fi

# ═══════════════════════════════════════════════════════════
# STEP 3: Firebase Hosting (CDN edge rules)
# ═══════════════════════════════════════════════════════════
if [ "$SKIP_FIREBASE" = true ]; then
  echo -e "${YELLOW}  ⏭  Skipping Firebase hosting (--skip-firebase)${NC}"
else
  print_step "Step 3/3 · Refreshing Firebase CDN Hosting"

  npx -y firebase-tools@latest deploy --only hosting --project "$PROJECT"

  print_success "Firebase CDN updated → https://teamusa-8b1ba.web.app"
fi

# ═══════════════════════════════════════════════════════════
# Done
# ═══════════════════════════════════════════════════════════
END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))
MINUTES=$(( ELAPSED / 60 ))
SECONDS=$(( ELAPSED % 60 ))

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  🎉 All 3 services deployed in ${MINUTES}m ${SECONDS}s!${NC}"
echo -e "${GREEN}  🌐 Live App  → https://teamusa-8b1ba.web.app${NC}"
echo -e "${GREEN}  📡 API Docs  → $API_URL/docs${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
