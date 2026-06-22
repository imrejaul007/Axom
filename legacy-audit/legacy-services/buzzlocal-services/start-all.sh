#!/bin/bash

# Start all BuzzLocal services

echo "Starting all services..."

# Start MongoDB if not running
if ! docker ps | grep -q buzzlocal-mongodb; then
    echo "Starting MongoDB..."
    docker compose up -d mongodb
fi

# Start services
echo "Starting feed service..."
cd buzzlocal-feed-service && npm run dev &
cd ..

echo "Starting vibe service..."
cd buzzlocal-vibe-service && npm run dev &
cd ..

echo "Starting community service..."
cd buzzlocal-community-service && npm run dev &
cd ..

echo "Starting events service..."
cd z-events-service && npm run dev &
cd ..

echo ""
echo "All services started!"
echo "Check status with: docker compose ps"
echo "View logs with: docker compose logs -f"
