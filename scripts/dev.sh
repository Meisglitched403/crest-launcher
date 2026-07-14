#!/bin/bash
# Start Python backend in background
PYTHONPATH=backend python3 -c "from crest.server import serve; serve()" &
PYTHON_PID=$!
echo "Python server PID: $PYTHON_PID"

# Start Vite
npx vite dev

# Cleanup
kill $PYTHON_PID 2>/dev/null
