#!/bin/bash
DEVICE=$1
ADB=adb
PACKAGENAME=com.example.app

if [ -z "$DEVICE" ]; then
# Recursively spin up threads/loops for every active device connected
$ADB devices | grep -v attached | grep device | cut -f1 | while read -r FOUND_DEVICE; do
    # Ensure it references the current running script name dynamically
    "$0" "$FOUND_DEVICE"
done
else
echo "Fetching real-time logs for device: $DEVICE ($PACKAGENAME)"

# 1. Fetch the absolute current PID of your specific package on the device
# pidof is standard on Android 6.0+, otherwise we fallback to a safe grep structure
PID=$($ADB -s "$DEVICE" shell pidof "$PACKAGENAME" | tr -d '\r\n')

if [ -z "$PID" ]; then
    echo "Warning: Package '$PACKAGENAME' is not currently running on $DEVICE."
    echo "Starting logcat stream without PID filtering fallback..."
    # Fallback to standard time-filtered logcat if app isn't open yet
    $ADB -s "$DEVICE" logcat -T "$(date "+%m-%d %H:%M:%S.0")"
else
    echo "Target Application Process ID found: $PID"
    # 2. Modern Android logcat supports native --pid filtering directly.
    # We pass the host machine's timestamp string format (MM-DD HH:MM:SS.0) used by Android logcat
    $ADB -s "$DEVICE" logcat -T "$(date "+%m-%d %H:%M:%S.0")" --pid="$PID"
fi
fi
