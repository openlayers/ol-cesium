ifeq ($(shell uname),Darwin)
	SEDI := $(shell which sed) -i ''
else
	SEDI := $(shell which sed) -i
endif
UNAME := $(shell uname)
SRC_JS_FILES := $(shell find src -type f -name '*.js')
EXAMPLES_JS_FILES := $(shell find examples -type f -name '*.js')
EXAMPLES_HTML_FILES := $(shell find examples -type f -name '*.html')
EXAMPLES_GEOJSON_FILES := $(shell find examples/data/ -name '*.geojson')
CESIUM_COMPILE_TARGET = minify

.PHONY: all
all: help

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo
	@echo "Main targets:"
	@echo
	@echo "- dist                    Create a "distribution" for the library (dist/olcesium.js)"
	@echo "- check                   Perform a number of checks on the code (lint, compile, etc.)"
	@echo "- lint                    Check the code with the linter"
	@echo "- serve                   Run a development web server for running the examples"
	@echo "- dist-examples           Create a "distribution" for the examples (dist/examples/)"
	@echo "- dist-apidoc             Create a "distribution" for the api docs (dist/apidoc/)"
	@echo "- clean                   Remove generated files"
	@echo "- cleanall                Remove all the build artefacts"
	@echo "- help                    Display this help message"
	@echo

.PHONY: npm-install
npm-install: .build/node_modules.timestamp

.PHONY: serve
serve: npm-install
	node build/serve.js

.PHONY: dist
dist: dist/olcesium.js dist/olcesium-debug.js CHANGES.md .build/es6_package.timestamp
	cp CHANGES.md dist/

.PHONY: dist-examples
dist-examples: .build/dist-examples.timestamp

.PHONY: dist-apidoc
dist-apidoc:
	node node_modules/.bin/jsdoc -c build/jsdoc/api/conf.json -d dist/apidoc

.PHONY: lint
lint: .build/node_modules.timestamp .build/eslint.timestamp

.build/geojsonhint.timestamp: $(EXAMPLES_GEOJSON_FILES)
	$(foreach file,$?, echo $(file); node_modules/.bin/geojsonhint $(file);)
	touch $@

.PHONY: check
check: lint dist

.PHONY: clean
clean:
	rm -f dist/olcesium.js
	rm -rf dist/ol
	rm -rf dist/examples
	rm -rf dist/Cesium

.PHONY: cleanall
cleanall: clean
	rm -rf .build
	rm -rf node_modules

.build/node_modules.timestamp: package.json
	npm install
	mkdir -p $(dir $@)
	touch $@

.build/eslint.timestamp: $(SRC_JS_FILES) $(EXAMPLES_JS_FILES)
	./node_modules/.bin/eslint $^
	touch $@

.build/dist-examples.timestamp: dist/olcesium.js $(EXAMPLES_JS_FILES) $(EXAMPLES_HTML_FILES)
	node build/parse-examples.js
	mkdir -p $(dir $@)
	cp -R node_modules/@camptocamp/cesium/Build/Cesium dist/
	cp -R node_modules/@camptocamp/cesium/Build/CesiumUnminified dist/
	cp -R examples dist/
	cp node_modules/openlayers/css/ol.css dist/
	cp css/olcs.css dist/
	$(SEDI) 'sYDIST = falseYDIST = trueY' dist/examples/inject_ol_cesium.js
	$(SEDI) 'sY@loaderYolcesium.jsY' dist/examples/inject_ol_cesium.js
	$(SEDI) 'sY../node_modules/@camptocamp/cesium/Build/Y../Y' dist/examples/inject_ol_cesium.js
	for f in dist/examples/*.html; \
	do \
	  $(SEDI) 'sY../node_modules/openlayers/css/ol.cssY../ol.cssY' $$f; \
	done
	for f in dist/examples/*.js; \
	do \
	  $(SEDI) '/goog.provide.*/d' $$f; \
	  $(SEDI) '/goog.require.*/d' $$f; \
	done
	touch $@

dist/olcesium-debug.js: build/olcesium-debug.json $(SRC_JS_FILES) build/build.js .build/node_modules.timestamp
	mkdir -p $(dir $@)
	node build/build.js $< $@


dist/olcesium.js: build/olcesium.json $(SRC_JS_FILES) build/build.js .build/node_modules.timestamp
	mkdir -p $(dir $@)
	node build/build.js $< $@
