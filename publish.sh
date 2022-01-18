#!/bin/bash

set -ex

VERSION=$(node --eval "console.log(require('./package.json').version);")

# publish master branch
npm run build
git commit -am "v$VERSION"
git tag v$VERSION -f
git push --tags -f
git push

# update pages
git checkout gh-pages
git merge master
git push
git checkout master

# publish npm
npm publish