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
	@echo "- dist                    Create a "distribution" for the library (dist/ol3cesium.js)"
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
serve: npm-install ol3/build/olX cesium/Build/Cesium/Cesium.js
	node build/serve.js

.PHONY: dist
dist: dist/ol3cesium.js dist/ol3cesium-debug.js CHANGES.md
	cp CHANGES.md dist/

.PHONY: dist-examples
dist-examples: .build/dist-examples.timestamp

.PHONY: dist-apidoc
dist-apidoc:
	node node_modules/.bin/jsdoc -c build/jsdoc/api/conf.json -d dist/apidoc

.PHONY: lint
lint: .build/python-venv/bin/gjslint .build/gjslint.timestamp
	@build/check-no-goog.sh

.build/geojsonhint.timestamp: $(EXAMPLES_GEOJSON_FILES)
	$(foreach file,$?, echo $(file); node_modules/geojsonhint/bin/geojsonhint $(file);)
	touch $@

.PHONY: check
check: lint dist .build/geojsonhint.timestamp

.PHONY: clean
clean:
	rm -f dist/ol3cesium.js
	rm -f ol3/build/ol.js
	rm -f ol3/build/ol-debug.js
	rm -f ol3/build/ol.css
	rm -f ol3/build/ol-externs.js
	rm -rf cesium/Build/Cesium
	rm -rf cesium/Build/CesiumUnminified
	rm -rf dist/ol3
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

.build/gjslint.timestamp: $(SRC_JS_FILES)
	.build/python-venv/bin/gjslint --jslint_error=all --strict --custom_jsdoc_tags=api $?
	touch $@

.build/dist-examples.timestamp: ol3/build/olX cesium/Build/Cesium/Cesium.js dist/ol3cesium.js $(EXAMPLES_JS_FILES) $(EXAMPLES_HTML_FILES)
	node build/parse-examples.js
	mkdir -p $(dir $@)
	mkdir -p dist/ol3
	cp ol3/build/ol-debug.js dist/ol3/
	cp ol3/build/ol.js dist/ol3/
	mkdir -p dist/ol3/css
	cp ol3/build/ol.css dist/ol3/css/
	cp -R cesium/Build/Cesium dist/
	cp -R examples dist/
	for f in dist/examples/*.html; do $(SEDI) 'sY/@loaderY../ol3cesium.jsY' $$f; done
	for f in dist/examples/*.html; do $(SEDI) 'sY../ol3/build/ol.jsY../ol3/ol-debug.jsY' $$f; done
	for f in dist/examples/*.html; do $(SEDI) 'sY../cesium/Build/Y../Y' $$f; done
	for f in dist/examples/*.js; do $(SEDI) 'sY../cesium/Build/Y../Y' $$f; done
	touch $@

.build/python-venv:
	mkdir -p $(dir $@)
	virtualenv --no-site-packages $@

.build/python-venv/bin/gjslint: .build/python-venv
	.build/python-venv/bin/pip install "http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz"
	touch $@

dist/ol3cesium-debug.js: build/ol3cesium-debug.json $(SRC_JS_FILES) ol3/build/ol-externs.js Cesium.externs.js build/build.js npm-install
	mkdir -p $(dir $@)
	node build/build.js $< $@

# A sourcemap is prepared, the source is exected to be deployed in 'source' directory
dist/ol3cesium.js: build/ol3cesium.json $(SRC_JS_FILES) ol3/build/ol-externs.js Cesium.externs.js build/build.js npm-install
	mkdir -p $(dir $@)
	node build/build.js $< $@
	$(SEDI) 's!$(shell pwd)/dist!source!g' dist/ol3cesium.js.map
	$(SEDI) 's!$(shell pwd)!source!g' dist/ol3cesium.js.map
#	echo '//# sourceMappingURL=ol3cesium.js.map' >> dist/ol3cesium.js
#	-ln -s .. dist/source

.PHONY: ol3/build/ol-externs.js
ol3/build/ol-externs.js:
	(cd ol3 && npm install && node tasks/generate-externs.js build/ol-externs.js)

.PHONY: ol3/build/olX
ol3/build/olX:
	(cd ol3 && npm install && make build)

cesium/node_modules/.bin/gulp: cesium/package.json
	cd cesium && npm install

# Only generated when cesium/Build/Cesium/Cesium.js does not exist
# or CHANGES.md changed
ifndef NO_CESIUM
cesium/Build/Cesium/Cesium.js: cesium/CHANGES.md cesium/node_modules/.bin/gulp
	(cd cesium && node_modules/.bin/gulp $(CESIUM_COMPILE_TARGET))
else
cesium/Build/Cesium/Cesium.js:
	mkdir -p cesium/Build/Cesium/
endif
