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
  -t my-angular-app \
  --load .