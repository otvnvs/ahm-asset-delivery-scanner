#!/bin/bash
DEVICE=$1
ADB=adb
PACKAGENAME=com.example.app
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo starting $PACKAGENAME
if [ -z "$DEVICE" ]
then
	$ADB devices|grep -v attached|grep device|cut -f1|while read DEVICE;do
		echo $ADB -s "$DEVICE" shell "monkey -p $PACKAGENAME -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1"
		$SCRIPT_DIR/start.sh "$DEVICE"
	done
else
	echo starting android application
	$ADB -s "$DEVICE" shell "monkey -p $PACKAGENAME -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1"
fi
