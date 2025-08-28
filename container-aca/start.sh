#!/usr/bin/env bash
set -euo pipefail

# Start the Node API in background
node /opt/provisioner/app/index.js &

# Start nginx in foreground
exec nginx -g "daemon off;"
