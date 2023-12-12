#!/bin/sh

set -eu

wget $DISQUS_XML_URL -O disqus.xml
echo "unsafe-perm = true" > .npmrc
npm i
npm run build
echo $DEPLOY
exit 0
if [ -z "${DEPLOY}" ]; then
    echo "No deploy since DEPLOY is not set to true"
else
    npm run deploy
    aws cloudfront create-invalidation --distribution-id $DIST_ID --paths '/*'
fi