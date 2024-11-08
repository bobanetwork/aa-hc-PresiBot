# Stage 1: Build the application
FROM node:20-alpine AS build

# Make NETWORK argument required
ARG NETWORK
RUN test -n "$NETWORK" || (echo "NETWORK argument not provided" && false)
# Set working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm i
# Copy the rest of the application code
COPY . .
# Verify the env file exists before copying
RUN test -f .env-${NETWORK} || (echo ".env-${NETWORK} file not found" && false)
# Copy the correct .env file
COPY .env-${NETWORK} .env
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