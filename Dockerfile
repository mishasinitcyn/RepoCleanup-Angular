# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Create production environment file from template
RUN cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts && \
    sed -i 's|${FAST_API_URL}|'${FAST_API_URL}'|g; s|${API_URL}|'${API_URL}'|g; s|${GITHUB_CLIENT_ID}|'${GITHUB_CLIENT_ID}'|g; s|${GITHUB_REDIRECT_URI}|'${GITHUB_REDIRECT_URI}'|g' src/environments/environment.prod.ts

# Set environment variable for production build
ENV NODE_ENV=production

# Build the Angular application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "serve:ssr:repo-cleanup"]