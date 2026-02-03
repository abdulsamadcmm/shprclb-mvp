FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies (cached unless package files change)
RUN pnpm install --frozen-lockfile

# Copy source after install
COPY . .

EXPOSE 3001

# Use dev mode for hot reload
CMD ["pnpm", "start:dev"]
