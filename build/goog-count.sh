#!/bin/sh

echo 'goog library usage:'
grep -Rn 'goog\.[a-zA-Z0-9\.]' src/ | sed 's/.*\(goog\.[a-zA-Z0-9\.]*\).*/\1/' | grep -v goog.asserts | grep -v goog.provide | grep -v goog.require | sort | uniq -c | sort
