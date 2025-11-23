#!/bin/bash

# Start local development server
cd "/Users/ruankoekemoer/Sharepoint Test/stock-take-app"

echo "🚀 Starting local development server..."
echo "📱 Open http://localhost:8080 in your browser"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8080

