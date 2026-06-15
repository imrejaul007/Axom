#!/bin/bash

# Check status of all BuzzLocal services

echo "=== BuzzLocal Services Status ==="
echo ""

# Check each service
check_service() {
    local name=$1
    local port=$2

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health 2>/dev/null | grep -q "200"; then
        echo "✓ $name (port $port) - Running"
    else
        echo "✗ $name (port $port) - Not responding"
    fi
}

check_service "Feed Service" 4000
check_service "Vibe Service" 4003
check_service "Community Service" 4004
check_service "Events Service" 4008

echo ""
echo "=== MongoDB ==="
docker ps | grep buzzlocal-mongodb > /dev/null && echo "✓ MongoDB - Running" || echo "✗ MongoDB - Not running"
