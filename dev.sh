#!/usr/bin/env bash
# TeamUSA Oracle — unified dev runner
# Usage: npm run dev  (from project root)

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

prefix_lines() {
  local label="$1" color="$2"
  while IFS= read -r line; do
    printf "${color}${BOLD}[%s]${NC} %s\n" "$label" "$line"
  done
}

cleanup() {
  printf "\n${BOLD}Shutting down...${NC}\n"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  printf "${BOLD}Done.${NC}\n"
  exit 0
}
trap cleanup SIGINT SIGTERM

printf "${CYAN}${BOLD}[API]${NC} Starting FastAPI on http://localhost:8000\n"
(cd backend && .venv/bin/uvicorn main:app --reload --port 8000 2>&1 | prefix_lines "API" "$CYAN") &
BACKEND_PID=$!

printf "${MAGENTA}${BOLD}[WEB]${NC} Starting Next.js on http://localhost:3000\n\n"
(cd frontend && npm run dev 2>&1 | prefix_lines "WEB" "$MAGENTA") &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
