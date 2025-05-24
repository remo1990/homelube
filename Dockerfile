# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY backend/ .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 