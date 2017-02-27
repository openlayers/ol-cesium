#!/bin/sh
FORBIDDEN="goog.isArray goog.isFunction goog.isString goog.bind goog.array goog.dom goog.events goog.isDef goog.isDefAndNotNull goog.isNull"
for method in $FORBIDDEN;
do
  grep -Rn "$method" src/ && echo "Use standard ES5.1 instead of $method" && return 1;
  echo -n ''
done
