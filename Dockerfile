# Use official Node.js runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
