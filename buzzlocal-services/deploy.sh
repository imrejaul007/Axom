#!/bin/bash

# BuzzLocal Services Deployment Script

set -e

echo "🚀 Deploying BuzzLocal Services..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Service ports
FEED_PORT=4000
VIBE_PORT=4003
COMMUNITY_PORT=4004
EVENTS_PORT=4008

# Check if MongoDB is running
check_mongo() {
    echo -e "${YELLOW}Checking MongoDB...${NC}"
    if command -v mongosh &> /dev/null; then
        mongosh --eval "db.adminCommand('ping')" 2>/dev/null && echo -e "${GREEN}✓ MongoDB is running${NC}" || echo -e "${RED}✗ MongoDB is not running${NC}"
    elif command -v mongo &> /dev/null; then
        mongo --eval "db.adminCommand('ping')" 2>/dev/null && echo -e "${GREEN}✓ MongoDB is running${NC}" || echo -e "${RED}✗ MongoDB is not running${NC}"
    else
        echo -e "${YELLOW}⚠ Cannot check MongoDB (mongosh not found)${NC}"
    fi
}

# Install dependencies for a service
install_deps() {
    local service=$1
    echo -e "${YELLOW}Installing dependencies for $service...${NC}"
    cd "$service"
    npm install
    cd ..
}

# Start a service
start_service() {
    local service=$1
    local port=$2
    local name=$(basename "$service")

    echo -e "${YELLOW}Starting $name on port $port...${NC}"

    # Check if already running
    if lsof -i :$port &> /dev/null; then
        echo -e "${RED}✗ Port $port is already in use${NC}"
        return 1
    fi

    cd "$service"

    # Build first
    npm run build 2>/dev/null || true

    # Start in background
    npm run dev &
    cd ..

    echo -e "${GREEN}✓ $name started${NC}"
}

# Main deployment
main() {
    echo "======================================"
    echo "  BuzzLocal Services Deployment"
    echo "======================================"
    echo ""

    # Check MongoDB
    check_mongo

    echo ""
    echo -e "${YELLOW}Installing all dependencies...${NC}"

    for service in buzzlocal-feed-service buzzlocal-vibe-service buzzlocal-community-service z-events-service; do
        install_deps "$service"
    done

    echo ""
    echo -e "${YELLOW}Starting services...${NC}"

    # Start in background
    (cd buzzlocal-feed-service && npm run dev > /dev/null 2>&1 &)
    (cd buzzlocal-vibe-service && npm run dev > /dev/null 2>&1 &)
    (cd buzzlocal-community-service && npm run dev > /dev/null 2>&1 &)
    (cd z-events-service && npm run dev > /dev/null 2>&1 &)

    sleep 2

    echo ""
    echo "======================================"
    echo -e "${GREEN}✓ All services deployed!"
    echo "======================================"
    echo ""
    echo "Services:"
    echo "  • Feed Service:      http://localhost:$FEED_PORT"
    echo "  • Vibe Service:     http://localhost:$VIBE_PORT"
    echo "  • Community Service: http://localhost:$COMMUNITY_PORT"
    echo "  • Events Service:    http://localhost:$EVENTS_PORT"
    echo ""
    echo "To check status: curl http://localhost:<port>/health"
    echo ""
}

main "$@"
