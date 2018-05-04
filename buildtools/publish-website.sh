#!/bin/bash -ex

# Create distribution
rm -Rf dist/*
make dist

CLONE="gh-pages-clone"
# Publish distribution contents to gh-pages
pushd .build
git clone -b gh-pages --single-branch git@github.com:openlayers/ol-cesium.git $CLONE
cp -Rf ../dist/* $CLONE/
cd $CLONE
git add -A .
git commit --quiet --amend -m "Updating gh-pages"
git push origin gh-pages -f
popd

# Cleanup
rm -Rf $CLONE
popd
