# ---- Base Stage ----
# Use Node.js 22 on Debian Bullseye as the base image
FROM node:22-bullseye AS base
LABEL app="smart-goals-app"
WORKDIR /app

# ---- Dependencies Stage ----
# Install only production dependencies to keep this layer small
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json (or other lock files if you use yarn/pnpm)
COPY package.json package-lock.json* ./
# If you were using pnpm, you'd copy pnpm-lock.yaml and use pnpm commands.
# If you were using yarn, you'd copy yarn.lock and use yarn commands.

# Install production dependencies using npm ci for consistency
RUN npm ci --only=production

# ---- Builder Stage ----
# This stage builds the Next.js application
FROM base AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .

# Set NEXT_TELEMETRY_DISABLED to 1 to disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
# This will use the `build` script from your package.json
RUN npm run build
# This should generate the .next/standalone directory because of `output: 'standalone'`

# ---- Runner Stage ----
# This stage creates the final, small image to run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Set NEXT_TELEMETRY_DISABLED to 1 to disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user and group for better security (optional but recommended)
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs # Uncomment to run as non-root user

# Copy the standalone output from the builder stage
# This includes the Next.js server and minimal dependencies
COPY --from=builder /app/.next/standalone ./

# Copy the public assets and static files
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# The SQLite database will be created in the '/app/data' directory inside the container
# when the application starts (due to the logic in src/lib/db.ts).
# To persist this database across container restarts, you should mount a volume
# to /app/data when running the container. E.g.:
# docker run -v my_smart_goals_data:/app/data -p 3000:3000 <your_image_name>

# Expose the port the app runs on
EXPOSE 3000

# Set the default command to start the Next.js server
# The host 0.0.0.0 is important to accept connections from outside the container
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Command to run the standalone server
CMD ["node", "server.js"]
