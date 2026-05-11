# Use Node.js LTS version as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend application code
COPY backend/ .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
