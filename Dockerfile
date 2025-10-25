# Use Node.js 18 alpine image
FROM node:18-alpine
# Set working directory
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy all files
COPY . .
# Build the application
RUN npm run build
# Expose port
EXPOSE 3001
# Start the application
CMD ["npm", "run", "start"]
