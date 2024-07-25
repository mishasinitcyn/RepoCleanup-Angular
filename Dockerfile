# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install --legacy-peer-deps

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy the rest of the application code to the working directory
COPY . .

# Define build arguments
ARG FAST_API_URL
ARG API_URL
ARG GITHUB_CLIENT_ID
ARG GITHUB_REDIRECT_URI
ARG GITHUB_CLIENT_SECRET

# Create production environment file from template
RUN cp src/environments/environment.prod.template.ts src/environments/environment.ts && \
    sed -i 's|${FAST_API_URL}|'"$FAST_API_URL"'|g; s|${API_URL}|'"$API_URL"'|g; s|${GITHUB_CLIENT_ID}|'"$GITHUB_CLIENT_ID"'|g; s|${GITHUB_REDIRECT_URI}|'"$GITHUB_REDIRECT_URI"'|g; s|${GITHUB_CLIENT_SECRET}|'"$GITHUB_CLIENT_SECRET"'|g' src/environments/environment.ts

RUN echo "Contents of environment.ts:" && cat src/environments/environment.ts

# Build the Angular application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["sh", "-c", "FAST_API_URL=$FAST_API_URL API_URL=$API_URL GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID GITHUB_REDIRECT_URI=$GITHUB_REDIRECT_URI GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET npm run serve:ssr:repo-cleanup"]
