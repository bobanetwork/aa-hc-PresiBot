# Stage 1: Build the application
FROM node:20-alpine AS build

# Define build argument with a default value
ARG NETWORK=boba-sepolia

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application code
COPY . .

# Copy the correct .env file based on the NETWORK argument
# Add error handling if file doesn't exist
RUN if [ -f ".env-${NETWORK}" ]; then \
    cp .env-${NETWORK} .env; \
    else \
    echo "Error: .env-${NETWORK} file not found"; \
    exit 1; \
    fi

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]