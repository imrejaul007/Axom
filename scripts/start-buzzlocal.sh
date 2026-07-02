#!/bin/bash
# BuzzLocal Startup Script
# Starts all backend services for local development

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   BuzzLocal Development Stack           ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "Checking MongoDB..."
if pgrep -x "mongod" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ MongoDB is running${NC}"
else
  echo -e "${YELLOW}⚠ MongoDB not running${NC}"
fi

echo ""
echo "Stopping existing services on ports 4019 4017 4015 4018 4016 4004 4000 4020 4021 4022..."
for port in 4019 4017 4015 4018 4016 4004 4000 4020 4021 4022; do
  pid=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pid" ] && kill $pid 2>/dev/null && echo "  Stopped port $port"
done

sleep 1
echo ""
echo "Starting services..."

start_service() {
  local name=$1
  local port=$2
  local dir="$BASE_DIR/buzzlocal-services/$name"
  if [ -d "$dir" ]; then
    cd "$dir" && nohup npx tsx src/index.ts > /tmp/buzzlocal-$name.log 2>&1 &
    echo -e "  ${GREEN}✓${NC} $name (port $port)"
  else
    echo -e "  ${RED}✗${NC} $name - Not found"
  fi
}

start_service buzzlocal-society-service 4019
start_service buzzlocal-safety-service 4017
start_service buzzlocal-ask-service 4015
start_service buzzlocal-agency-service 4018
start_service buzzlocal-trust-service 4016
start_service buzzlocal-community-service 4004
start_service buzzlocal-feed-service 4000
start_service buzzlocal-housing-service 4020
start_service buzzlocal-property-service 4021
start_service buzzlocal-rentfinance-service 4022

echo ""
echo "Waiting for services..."
sleep 6

echo ""
echo "Health checks:"
for port in 4019 4017 4015 4018 4016 4004 4000 4020 4021 4022; do
  curl -s --connect-timeout 2 http://localhost:$port/health > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Port $port"
  else
    echo -e "  ${RED}✗${NC} Port $port"
  fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All services started!                  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Mobile app: cd buzzlocal-app && npx expo start"
echo "Logs: tail -f /tmp/buzzlocal-*.log"
echo ""
