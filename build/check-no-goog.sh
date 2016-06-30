#!/bin/sh
FORBIDDEN="goog.isString goog.bind goog.array goog.object goog.dom.appendChild goog.dom.getElement"
for method in $FORBIDDEN;
do
  grep -Rn "$method" src/ && echo "Use standard ES5.1 instead of $method" && return 1;
  echo -n ''
done
