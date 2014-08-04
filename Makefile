PLOVR = ./plovr-81ed862.jar

.PHONY: ol3, cesium, build

all: serve

ol3:
	@echo --- Runing OL3 compilation ...
	cd ./ol3 && python build.py
	node tasks/generate-externs.js build/ol-externs.js
cesium:
	@echo --- Runing Cesium compilation ...
	cd cesium && "./Tools/apache-ant-1.8.2/bin/ant" minify

serve: ol3, cesium
	@echo --- Serving ol3cesium-debug.json...
	java -jar $(PLOVR) serve ol3cesium-debug.json
build: ol3
	@echo --- Compiling ol3cesium.json...
	java -jar $(PLOVR) build ol3cesium.json > deploy/ol3cesium.js

lint:
	fixjsstyle --strict -r ./src
	gjslint --strict -r ./src
server:
	@echo --- Starting the webserver...
#	java -jar $(PLOVR) soyweb --dir .
	python -m SimpleHTTPServer 9811
