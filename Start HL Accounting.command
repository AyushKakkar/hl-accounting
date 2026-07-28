#!/bin/bash
# Double-click this file to open HL Accounting in your browser.
cd "$(dirname "$0")"
PORT=8777
if ! curl -s -o /dev/null "http://localhost:$PORT/index.html"; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/index.html"
echo "HL Accounting is running at http://localhost:$PORT"
echo "Keep this Terminal window open while you use it. Close it when you're done."
wait
