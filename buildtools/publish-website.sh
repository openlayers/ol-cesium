#!/bin/bash -ex

# Create distribution
make cleanall
make dist

CLONE=".build/gh-pages-clone"
# Publish distribution contents to gh-pages
git clone -b gh-pages --single-branch git@github.com:openlayers/ol-cesium.git $CLONE
rm -rf $CLONE/*

cp -R gh-pages-template/* $CLONE/
cp -Rf dist/* $CLONE/
cat gh-pages-template/index.md README.md > $CLONE/index.md

pushd $CLONE
git add -A .
git commit --quiet --amend -m "Updating gh-pages"
git push origin gh-pages -f
popd

# Cleanup
rm -Rf $CLONE
