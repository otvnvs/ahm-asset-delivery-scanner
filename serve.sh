#!/bin/bash
darkhttpd \
	./\
	--header "Cache-Control: max-age=3600" \
	--header "X-Frame-Options: DENY" \
	--port 4321

