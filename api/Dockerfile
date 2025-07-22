# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
# Assuming the app is in the 'api' directory, so we copy from there.
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code from the 'api' directory
COPY ./ ./

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the application
CMD ["node", "index.js"]
