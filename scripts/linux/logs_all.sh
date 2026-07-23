#!/bin/bash
DEVICE=$1
ADB=adb
PACKAGENAME=com.example.app
$ADB logcat -T "$(date "+%m-%d %H:%M:%S.0")"

