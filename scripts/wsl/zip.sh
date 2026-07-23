#!/bin/bash
PORT=8080
ZIP_PATH=zip/main.zip
WATCH_DIR="./src"

# Function to handle the zipping process with optional logging
create_zip() {
    local is_rebuild=$1
    mkdir -p ./zip
    zip -r $ZIP_PATH . -x "zip/*" ".*" ".**/*" "**/node_modules/*" "**/dist/*" > /dev/null 2>&1
    
    # Print log to stdout
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    if [ "$is_rebuild" = "true" ]; then
        echo "[$timestamp] [WATCHER] Change detected in $WATCH_DIR. Recompiled $ZIP_PATH successfully."
    else
        echo "[$timestamp] [INIT] Initial zip file created at $ZIP_PATH."
    fi
}

# Function to watch for changes using your timestamp polling mechanism
watch_changes() {
    declare -A FILE_TIMESTAMPS

    # Initialize base timestamps for files in ./src (Ignoring Vim/editor temporary tracks)
    for f in $(find "$WATCH_DIR" -type f -not -name ".*.swp" -not -name "*~" 2>/dev/null); do
        FILE_TIMESTAMPS["$f"]=$(stat -c %Y "$f" 2>/dev/null || echo 0)
    done

    # Run the polling check endlessly in the background
    while true; do
        local change_detected=false

        for current_file in $(find "$WATCH_DIR" -type f -not -name ".*.swp" -not -name "*~" 2>/dev/null); do
            current_time=$(stat -c %Y "$current_file" 2>/dev/null || echo 0)
            last_time=${FILE_TIMESTAMPS["$current_file"]}

            # If the file is brand new, or its modification time has increased
            if [ -z "$last_time" ] || [ "$current_time" -gt "$last_time" ]; then
                FILE_TIMESTAMPS["$current_file"]=$current_time
                
                # Only trigger a recompile if it's a modification (not the initial loop scan)
                if [ ! -z "$last_time" ]; then
                    change_detected=true
                fi
            fi
        done

        if [ "$change_detected" = true ]; then
            create_zip "true"
        fi

        sleep 1.0
    done
}

# 1. Run the initial zip process silently
create_zip "false"

# 2. Extract network details
IP_ADDRESS=$(cmd.exe /c ipconfig | grep -A 10 "WiFi" | grep "IPv4 Address" | awk -F': ' '{print $2}' | tr -d '\r')
URL="http://$IP_ADDRESS:$PORT/$ZIP_PATH"

# 3. Clear the screen
clear

# 4. Generate the high-contrast UTF8/ANSI block QR code
QR_DATA=$(qrencode -t ansiutf8 "$URL")

# 5. Get terminal dimensions
TERM_COLS=$(tput cols)
TERM_ROWS=$(tput lines)

# Calculate the height (number of rows) of the QR code
QR_HEIGHT=$(echo "$QR_DATA" | wc -l)
PADDING_ROWS=$(( (TERM_ROWS - QR_HEIGHT - 4) / 2 ))

# Print top vertical padding
for ((i=0; i<PADDING_ROWS; i++)); do echo ""; done

# Print the URL centered
URL_LEN=${#URL}
PADDING_URL_COLS=$(( (TERM_COLS - URL_LEN) / 2 ))
printf "%${PADDING_URL_COLS}s%s\n\n" "" "$URL"

# 6. Print the QR code centered horizontally
echo "$QR_DATA" | while IFS= read -r line; do
    VISIBLE_LINE=$(echo "$line" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g')
    LINE_LEN=${#VISIBLE_LINE}
    PADDING_COLS=$(( (TERM_COLS - LINE_LEN) / 2 ))
    printf "%${PADDING_COLS}s%s\n" "" "$line"
done

# Print bottom vertical padding
for ((i=0; i<PADDING_ROWS; i++)); do echo ""; done

# 7. Start the background file polling loop
watch_changes &
WATCHER_PID=$!

# Clean up the background subshell loop when stopping (Ctrl+C, closing window, etc.)
cleanup() {
    kill $WATCHER_PID 2>/dev/null
    echo -e "\nServer stopped."
    exit 0
}
trap cleanup INT TERM HUP EXIT

# 8. Start the web server
echo "------------------------------------------------------------------------"
echo "Starting darkhttpd... File updates and access logs will stream below:"
echo "------------------------------------------------------------------------"
darkhttpd ./ --port $PORT

