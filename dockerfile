# Use the official Node.js image.
FROM node:18-alpine

# Set the working directory.
WORKDIR /app

# Copy the package.json and package-lock.json.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the app's source code.
COPY . .

# Build the Next.js app.
RUN npm run build

# Expose the port.
EXPOSE 8080

# Start the app in production mode.
CMD ["npm", "run", "start:prod"]
