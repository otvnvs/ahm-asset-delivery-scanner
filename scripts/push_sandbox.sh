#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
ADB=/mnt/c/usr/bin/adb.exe
TARGET_PRIVATE_DIR="/data/user/0/$APP_PACKAGE/files"

# Source directory to push
SRC_DIR="./dist"

# Intermediate staging area natively readable by the unprivileged app user
LOCAL_TMP_DIR="/data/local/tmp/MyHybridMobileStaging"

echo "---------------------------------------------------"
echo "Streaming project directly to private sandbox..."
echo "---------------------------------------------------"

# Check if the local dist folder exists before proceeding
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Local source directory '$SRC_DIR' does not exist!"
    exit 1
fi

# 1. Clear out and rebuild the local temporary staging area on the device
echo "Preparing temporary staging area on device..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR' && mkdir -p '$LOCAL_TMP_DIR'"

# 2 & 3. Push the contents of ./dist directly into the staging folder as 'www'
echo "Pushing $SRC_DIR assets to intermediate staging ground..."
$ADB push "$SRC_DIR/." "$LOCAL_TMP_DIR/www" > /dev/null

# 4. Enforce global access rules on our temporary staging area so run-as can read it
echo "Opening staging permissions for application context..."
$ADB shell "chmod -R 777 '$LOCAL_TMP_DIR'"

# 5. Clean, prepare, and copy the assets straight into the secure sandbox
echo "Deploying from staging ground directly into secure sandbox..."
$ADB shell "run-as $APP_PACKAGE mkdir -p files"
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE cp -r '$LOCAL_TMP_DIR/www' files/"

# 6. Purge the global temporary folder to avoid cluttering up device space
echo "Cleaning up temporary staging data..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR'"

# 7. Correct permissions inside the private folder to guarantee WebView readability
echo "Enforcing read/write permissions on sandbox assets..."
$ADB shell "run-as $APP_PACKAGE chmod -R 777 files/www"

# 8. Signal the active WebView layer to execute a live reload interface transition
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Direct Sandbox Sync Complete!"
echo "---------------------------------------------------"

