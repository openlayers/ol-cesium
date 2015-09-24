#!/bin/sh
FORBIDDEN="goog.isString goog.isArray goog.bind goog.array.remove goog.array.forEach"
for method in $FORBIDDEN;
do
  grep -Rn "$method" src/ && echo "Use standard ES5.1 instead of $method" && return 1;
  echo -n ''
done
