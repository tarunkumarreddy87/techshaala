# Use Node.js 18 alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy all files
COPY . .

# Expose port
EXPOSE 3001

# Start the application directly with tsx
CMD ["npm", "run", "start"]