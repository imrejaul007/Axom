#!/bin/bash

# ==============================================
# BuzzLocal City OS - Quick Start Script
# ==============================================

set -e

echo "🚀 Starting BuzzLocal City OS Services..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check for MongoDB (local) or use Docker
if ! command -v mongod &> /dev/null && ! docker ps | grep -q buzzlocal-mongo; then
    echo -e "${YELLOW}Starting MongoDB container...${NC}"
    docker run -d --name buzzlocal-mongo \
        -p 27017:27017 \
        -v buzzlocal-mongo-data:/data/db \
        mongo:7
fi

# Start all services
echo -e "${GREEN}Starting City OS services...${NC}"
docker-compose -f docker-compose.city-os.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check service health
echo ""
echo "📊 Service Status:"
echo "================"

services=(
    "buzzlocal-ask:4015"
    "buzzlocal-trust:4016"
    "buzzlocal-safe:4017"
    "buzzlocal-agency:4018"
    "buzzlocal-society:4019"
    "buzzlocal-feed:4000"
    "buzzlocal-vibe:4003"
    "buzzlocal-events:4008"
    "buzzlocal-intelligence:4010"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (Port $port)"
    else
        echo -e "${RED}✗${NC} $name (Port $port)"
    fi
done

echo ""
echo -e "${GREEN}City OS Services Started Successfully!${NC}"
echo ""
echo "📍 Service URLs:"
echo "================"
echo "  Ask Buzz API:     http://localhost:4015"
echo "  Trust Service:    http://localhost:4016"
echo "  Safety Service:   http://localhost:4017"
echo "  Agency Service:   http://localhost:4018"
echo "  Society Service:  http://localhost:4019"
echo "  Feed Service:     http://localhost:4000"
echo "  Vibe Service:     http://localhost:4003"
echo "  Events Service:   http://localhost:4008"
echo ""
echo "📖 API Documentation:"
echo "==================="
echo "  http://localhost:4015/docs  (Ask Buzz)"
echo "  http://localhost:4016/docs  (Trust)"
echo "  http://localhost:4017/docs  (Safety)"
echo ""
echo "💡 Next Steps:"
echo "=============="
echo "  1. Update environment variables in .env"
echo "  2. Run 'docker-compose logs -f' to see logs"
echo "  3. Start the mobile app"
