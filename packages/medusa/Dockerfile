FROM node:20-alpine

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies (cached unless package files change)
RUN npm ci

# Copy source after install for better caching
COPY . .

EXPOSE 9000

# Use dev mode for local development
CMD ["npm", "run", "dev"]
