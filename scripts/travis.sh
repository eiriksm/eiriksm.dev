#!/bin/bash

set -e

wget $DISQUS_XML_URL -O disqus.xml

npm i
./node_modules/.bin/chromedriver --port=8643 --url-base=wd/hub &
composer install
npm run build
npm run serve &
./vendor/bin/wait-for-listen 9000
./vendor/bin/wait-for-listen 8643 127.0.0.1
