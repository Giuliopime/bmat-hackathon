FROM node:20-slim

# Enable pnpm via Corepack (standard in Node.js >= 16.13)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# TODO only copy necessary files
COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
