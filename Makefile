SRC_JS_FILES := $(shell find src -type f -name '*.js')
EXAMPLES_JS_FILES := $(shell find examples -type f -name '*.js')
EXAMPLES_HTML_FILES := $(shell find examples -type f -name '*.html')


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
	@echo "- dist-examples           Create a "distribution" for the examples (in dist)"
	@echo "- clean                   Remove generated files"
	@echo "- cleanall                Remove all the build artefacts"
	@echo "- help                    Display this help message"
	@echo

.PHONY: npm-install
npm-install: .build/node_modules.timestamp

.PHONY: serve
serve: npm-install ol3/build/ol.js ol3/build/ol.css cesium/Build/Cesium/Cesium.js
	node build/serve.js

.PHONY: dist
dist: dist/ol3cesium.js

.PHONY: dist-examples
dist-examples: .build/dist-examples.timestamp

.PHONY: lint
lint: .build/python-venv/bin/gjslint .build/gjslint.timestamp

.PHONY: check
check: lint dist

.PHONY: clean
clean:
	rm -f dist/ol3cesium.js
	rm -f ol3/build/ol.js
	rm -f ol3/build/ol-debug.js
	rm -f ol3/build/ol.css
	rm -f ol3/build/ol-externs.js
	rm -f cesium/Build/Cesium/Cesium.js
	rm -rf dist/ol3
	rm -rf dist/examples
	rm -rf dist/Cesium

.PHONY: cleanall
cleanall: clean
	rm -rf .build

.build/node_modules.timestamp: package.json
	npm install
	mkdir -p $(dir $@)
	touch $@

.build/gjslint.timestamp: $(SRC_JS_FILES)
	.build/python-venv/bin/gjslint --jslint_error=all --strict --custom_jsdoc_tags=api $?
	touch $@

.build/dist-examples.timestamp: ol3/build/ol-debug.js ol3/build/ol.css cesium/Build/Cesium/Cesium.js dist/ol3cesium.js $(EXAMPLES_JS_FILES) $(EXAMPLES_HTML_FILES)
	mkdir -p $(dir $@)
	mkdir -p dist/ol3
	cp ol3/build/ol-debug.js dist/ol3/
	mkdir -p dist/ol3/css
	cp ol3/build/ol.css dist/ol3/css/
	cp -R cesium/Build/Cesium dist/
	cp -R examples dist/
	for f in dist/examples/*.html; do sed 'sY/@loaderY../ol3cesium.jsY' -i $$f; done
	for f in dist/examples/*.html; do sed 'sY../ol3/build/ol.jsY../ol3/ol-debug.jsY' -i $$f; done
	for f in dist/examples/*.html; do sed 'sY../cesium/Build/Cesium/Cesium.jsY../Cesium/Cesium.jsY' -i $$f; done
	touch $@

.build/python-venv:
	mkdir -p $(dir $@)
	virtualenv --no-site-packages $@

.build/python-venv/bin/gjslint: .build/python-venv
	.build/python-venv/bin/pip install "http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz"
	touch $@

# A sourcemap is prepared, the source is exected to be deployed in 'source' directory
dist/ol3cesium.js: build/ol3cesium.json $(SRC_JS_FILES) ol3/build/ol-externs.js Cesium.externs.js build/build.js
	mkdir -p $(dir $@)
	node build/build.js $< $@
	sed  -i 's!$(shell pwd)/dist!source!g' dist/ol3cesium.js.map
	sed  -i 's!$(shell pwd)!source!g' dist/ol3cesium.js.map
	echo '//# sourceMappingURL=ol3cesium.js.map' >> dist/ol3cesium.js
	-ln -s .. dist/source

ol3/build/ol-externs.js:
	(cd ol3 && npm install && node tasks/generate-externs.js build/ol-externs.js)

ol3/build/ol.js:
	(cd ol3 && npm install && python build.py build/ol.js)

ol3/build/ol-debug.js:
	(cd ol3 && npm install && python build.py build/ol-debug.js)

ol3/build/ol.css:
	(cd ol3 && npm install && python build.py build/ol.css)

cesium/Build/Cesium/Cesium.js:
	(cd cesium && ./Tools/apache-ant-1.8.2/bin/ant minify)
