#!/bin/bash
DEVICE=$1
ADB=adb
PACKAGENAME=com.example.app
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo stopping $PACKAGENAME
if [ -z "$DEVICE" ]
then
	$ADB devices|grep -v attached|grep device|cut -f1|while read DEVICE;do
		$SCRIPT_DIR/stop.sh $DEVICE
	done
else
	echo stopping android application
	$ADB -s "$DEVICE" shell "am force-stop $PACKAGENAME"
fi
