SRC_JS_FILES := $(shell find src -type f -name '*.js')

all: serve

.PHONY: npm-install
npm-install: .build/node_modules.timestamp

.PHONY: build-ol3
build-ol3:
	(cd ol3 && \
	 npm install && \
	 python build.py build/ol.js css/ol.css)

.PHONY: serve
serve: npm-install build-ol3 cesium/Build/Cesium/Cesium.js
	node build/serve.js

.PHONY: dist
dist: dist/ol3cesium.js

.PHONY: lint
lint: .build/python-venv/bin/gjslint .build/gjslint.timestamp

.PHONY: clean
clean:
	rm -f dist/ol3cesium.js
	rm -f ol3/build/ol.js
	rm -f ol3/build/ol.css
	rm -f ol3/build/ol-externs.js
	rm -f cesium/Build/Cesium/Cesium.js

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
	cp -R examples dist/
	for f in dist/examples/*.html; do sed 'sY/@loaderY../ol3cesium.jsY' -i $$f; done
	for f in dist/examples/*.html; do sed 'sY../ol3/build/ol.jsY../ol-debug.jsY' -i $$f; done
	for f in dist/examples/*.html; do sed 'sY../cesium/Build/Cesium/Cesium.jsY../Cesium/Cesium.jsY' -i $$f; done
	cp ol3/build/ol-debug.js dist/
	cp -R cesium/Build/Cesium dist/
	mkdir -p dist/ol3/css/
	cp ol3/build/ol.css dist/ol3/css/
	-ln -s .. dist/source


ol3/build/ol-externs.js:
	(cd ol3 && \
	 npm install && \
	 node tasks/generate-externs.js build/ol-externs.js)

cesium/Build/Cesium/Cesium.js:
	(cd cesium && \
	 ./Tools/apache-ant-1.8.2/bin/ant minify)
