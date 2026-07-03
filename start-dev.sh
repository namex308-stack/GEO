#!/bin/bash
# Restarts the dev server if it's not running
cd /home/z/my-project
if ! pgrep -f "next dev -p 3000" > /dev/null; then
  pkill -f "next dev" 2>/dev/null
  sleep 1
  nohup /home/z/my-project/node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
  echo "Dev server started at $(date)"
else
  echo "Dev server already running"
fi
