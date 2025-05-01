#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Install dependencies
echo "Installing dependencies..."
bun install --frozen-lockfile # Use --frozen-lockfile for reproducible installs in CI/CD or Docker

# Build the Next.js application
echo "Building the application..."
bun run build

# Start the Next.js production server
echo "Starting the application..."
exec bun run start # Use exec to replace the shell process with the Node.js process 