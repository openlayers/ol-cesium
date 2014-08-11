all: serve

.PHONY: npm-install
npm-install: .build/node_modules.timestamp

.PHONY: build-ol3
build-ol3:
	(cd ol3 && \
	 npm install && \
	 python build.py build/ol.js css/ol.css && \
	 node tasks/generate-externs.js build/ol-externs.js)

.PHONY: build-cesium
build-cesium: cesium/Build/Cesium/Cesium.js

.PHONY: serve
serve: npm-install build-ol3 build-cesium
	node build/serve.js

.PHONY: dist
dist: dist/ol3cesium.js

.PHONY: lint
lint: .build/python-venv/bin/gjslint
	.build/python-venv/bin/fixjsstyle --strict -r ./src
	.build/python-venv/bin/gjslint --jslint_error=all --strict --custom_jsdoc_tags=api -r ./src

.PHONY: server
server:
	python -m SimpleHTTPServer 9811

.PHONY: clean
clean:
	rm -f dist/ol3cesium.js

.PHONY: cleanall
cleanall: clean
	rm -rf .build

.build/node_modules.timestamp: package.json
	npm install
	mkdir -p $(dir $@)
	touch $@

.build/python-venv:
	mkdir -p $(dir $@)
	virtualenv --no-site-packages $@

.build/python-venv/bin/gjslint: .build/python-venv
	.build/python-venv/bin/pip install "http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz"
	touch $@

dist/ol3cesium.js: build/ol3cesium.json build-ol3
	mkdir -p $(dir $@)
	node build/build.js $< $@

cesium/Cesium/Build/Cesium.js:
	(cd cesium && \
	 ./Tools/apache-ant-1.8.2/bin/ant minify)
