#!/bin/sh

# Any call to the goog library except the followings are forbidden
echo "Checking use of goog library..."
if grep -Rn goog. src | grep -E -v 'goog.provide|goog.require|goog.module|goog.asserts'
then
  echo "Found forbidden uses."
  return 1
fi
