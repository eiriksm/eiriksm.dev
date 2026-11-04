#!/bin/sh

set -eu

wget --auth-no-challenge --user="$BASIC_AUTH_USERNAME" --password="$BASIC_AUTH_PASSWORD" "$DISQUS_XML_URL" -O disqus.xml
echo "unsafe-perm = true" > .npmrc

# Temporarily unset NODE_ENV to install devDependencies (needed for TypeScript build)
unset NODE_ENV
npm ci
export NODE_ENV=production

npm run build
if [ "$DEPLOY" == "0" ]; then
    echo "No deploy since DEPLOY is not set to true"
else
    npm run deploy
    aws cloudfront create-invalidation --distribution-id $DIST_ID --paths '/*'
fi
