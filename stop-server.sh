#!/bin/bash
# Stop any running Python HTTP servers on common ports

echo "🛑 Stopping any running servers..."

for port in 3000 3001 3002 4000 5000 8000 8080; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
done

echo "✅ Done!"

