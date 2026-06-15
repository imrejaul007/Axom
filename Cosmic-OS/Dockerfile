# Cosmic-OS Root Dockerfile
# References the API service Dockerfile

# This directory contains the Cosmic-OS product
# Build the API service using:
# cd src/services/cosmic-os-api && docker build -t cosmic-os-api .

FROM scratch
COPY README.md /
COPY src/ /src/
COPY cosmic-mobile/ /cosmic-mobile/

# Default target for docker compose
TARGET cosmic-os-api

# Ports exposed
EXPOSE 4070