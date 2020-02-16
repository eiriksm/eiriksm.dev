#!/bin/sh

set -eu

wget $DISQUS_XML_URL -O /disqus.xml

npm i
npm run build
npm run deploy
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths '/*'
