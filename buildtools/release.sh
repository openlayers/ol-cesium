#!/bin/sh -e

BUILD=.build/olcs_build

make dist

TAG=v`buildtools/get-version.sh version | cut -d. -f1-2`
VERSION=ol-cesium-$TAG
cp -R dist/ $VERSION && zip -r $VERSION.zip $VERSION; rm -rf $VERSION

mkdir -p $BUILD
cp -R src/olcs/* $BUILD 
cp ./css/olcs.css $BUILD
cp package.json $BUILD
sed -i 's/ol-cesium/olcs/g' $BUILD/package.json
sed -i '/"main"/d' $BUILD/package.json

echo
ls $BUILD
head $BUILD/package.json

echo
echo "Check everything is correct and publish to npm"
echo "cd $BUILD && npm publish"
echo
echo "cd ../.. && rm -rf $BUILD && npm publish && buildtools/publish-website.sh"
echo "git tag $TAG && git push --tags"
echo
echo "In addition, create the release on github and announce it"
