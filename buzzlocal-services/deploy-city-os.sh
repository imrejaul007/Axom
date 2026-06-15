#!/bin/bash

# ==============================================
# BuzzLocal City OS - Deployment Script
# ==============================================

set -e

# Configuration
IMAGE_PREFIX="buzzlocal"
REGISTRY="${DOCKER_REGISTRY:-registry.rezapp.io}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying BuzzLocal City OS...${NC}"

# Build all services
echo -e "\n📦 Building Docker images..."

services=(
    "buzzlocal-ask-service"
    "buzzlocal-trust-service"
    "buzzlocal-safety-service"
    "buzzlocal-agency-service"
    "buzzlocal-society-service"
    "buzzlocal-feed-service"
    "buzzlocal-vibe-service"
    "buzzlocal-community-service"
    "buzzlocal-intelligence-service"
    "buzzlocal-notification-service"
    "buzzlocal-realtime-service"
    "buzzlocal-weather-service"
)

for service in "${services[@]}"; do
    echo -e "Building ${service}..."
    docker build -t "${IMAGE_PREFIX}-${service}:latest" ./${service}/ || echo -e "${RED}Failed to build ${service}${NC}"
done

# Tag images
echo -e "\n🏷️ Tagging images..."
for service in "${services[@]}"; do
    docker tag "${IMAGE_PREFIX}-${service}:latest" "${REGISTRY}/${IMAGE_PREFIX}-${service}:latest"
done

# Push to registry (if registry is configured)
if [ -n "$REGISTRY" ]; then
    echo -e "\n📤 Pushing to registry..."
    for service in "${services[@]}"; do
        docker push "${REGISTRY}/${IMAGE_PREFIX}-${service}:latest" || echo -e "${RED}Failed to push ${service}${NC}"
    done
fi

# Deploy using docker-compose
echo -e "\n🚀 Deploying services..."
docker-compose -f docker-compose.city-os.yml pull
docker-compose -f docker-compose.city-os.yml up -d

# Health check
echo -e "\n🔍 Running health checks..."
sleep 10

for service in "${services[@]}"; do
    port="${service##*-}"
    case $service in
        *ask*) port=4015 ;;
        *trust*) port=4016 ;;
        *safety*) port=4017 ;;
        *agency*) port=4018 ;;
        *society*) port=4019 ;;
        *feed*) port=4000 ;;
        *vibe*) port=4003 ;;
        *intelligence*) port=4010 ;;
        *notification*) port=4011 ;;
        *realtime*) port=4012 ;;
        *weather*) port=4014 ;;
        *) port=4000 ;;
    esac

    if curl -sf "http://localhost:$port/health" > /dev/null; then
        echo -e "${GREEN}✓${NC} ${service}"
    else
        echo -e "${RED}✗${NC} ${service}"
    fi
done

echo -e "\n${GREEN}Deployment complete!${NC}"
