#!/bin/bash
set -e

# Start Python backend in background (detached so it survives script exit)
echo "Starting Python API server..."
setsid python3 -c "
import sys
sys.path.insert(0, 'backend')
from crest.server import serve
serve()
" < /dev/null > /tmp/crest-api.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Give it a moment to start
sleep 2

# Start Vite dev server
echo "Starting Vite frontend..."
npx vite dev --port 8080

# When Vite exits, kill the backend
echo "Stopping backend..."
kill $BACKEND_PID 2>/dev/null || true
