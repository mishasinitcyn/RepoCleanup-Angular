#!/bin/bash

# Load environment variables
source .env


# Build the Docker image
docker buildx build \
  --build-arg FAST_API_URL="$FAST_API_URL" \
  --build-arg API_URL="$API_URL" \
  --build-arg GITHUB_CLIENT_ID="$GITHUB_CLIENT_ID" \
  --build-arg GITHUB_REDIRECT_URI="$GITHUB_REDIRECT_URI" \
  --build-arg GITHUB_CLIENT_SECRET="$GITHUB_CLIENT_SECRET" \
  --build-arg DB_HOST="$DB_HOST" \
  --build-arg DB_PORT="$DB_PORT" \
  --build-arg DB_NAME="$DB_NAME" \
  --build-arg DB_USER="$DB_USER" \
  --build-arg DB_PASSWORD="$DB_PASSWORD" \
  -t my-angular-app \
  --load .