PLOVR = plovr-81ed862.jar

all: serve

.PHONY: download-plovr
download-plovr: .build/$(PLOVR)

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
serve: download-plovr build-ol3 build-cesium
	java -jar .build/$(PLOVR) serve ol3cesium-debug.json

.PHONY: build
build: dist/ol3cesium.js

.PHONY: lint
lint: .build/python-venv/bin/gjslint
	.build/python-venv/bin/fixjsstyle --strict -r ./src
	.build/python-venv/bin/gjslint --strict -r ./src

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

.build/$(PLOVR):
	mkdir -p $(dir $@)
	wget -O $@ https://plovr.googlecode.com/files/$(PLOVR)

dist/ol3cesium.js: ol3cesium.json download-plovr build-ol3
	mkdir -p $(dir $@)
	java -jar .build/$(PLOVR) build $< > $@

cesium/Cesium/Build/Cesium.js:
	(cd cesium && \
	 ./Tools/apache-ant-1.8.2/bin/ant minify)
