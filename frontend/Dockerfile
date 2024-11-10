# Stage 1: Build the application
FROM node:20-alpine AS build

ARG NETWORK
# Set working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm i
# Copy the rest of the application code
COPY . .
# Copy the correct .env-local file based on the NETWORK argument
COPY .env-${NETWORK} .env
# VITE needs env-vars at build time
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