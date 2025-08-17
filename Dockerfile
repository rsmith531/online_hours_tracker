# Dockerfile

# Stage 1: Build the Nuxt application
FROM node:22 AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# copy drizzle stuff for the schema
COPY drizzle.config.ts ./
COPY utils/db/schema/ ./utils/db/schema/

ARG NUXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NUXT_VAPID_PRIVATE_KEY

RUN npm run build

# Stage 2: Create the production-ready image
FROM node:22

WORKDIR /app

# Copy the built application from the builder stage
# This includes the server, public assets, and the .output directory
COPY --from=builder /app/.output .
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/workday_data* ./

COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/utils/db/schema/ ./utils/db/schema/

# install prod dependencies
RUN npm install --omit=dev

# The SQLite database file will be stored in a volume, so we need to
# create the directory where it will be stored inside the container.
RUN mkdir -p /app/data

# Expose the port Nuxt runs on, which is 3000 by default.
EXPOSE 3000

CMD ["node", "./server/index.mjs"]