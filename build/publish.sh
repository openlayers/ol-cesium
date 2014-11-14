#!/bin/bash

# Create distribution
rm -Rf dist/*
make dist-examples dist-apidoc
rm dist/source

# Publish distribution contents to gh-pages
cd build
git clone -b gh-pages git@github.com:openlayers/ol3-cesium.git
cp -Rf ../dist/* ol3-cesium/
cd ol3-cesium
git add .
git commit -m "Updating gh-pages"
git push origin gh-pages 

# Cleanup
cd ..
rm -Rf ol3-cesium
cd ..
