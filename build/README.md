This folder contains resources required for building the library and publishing the website.

Publishing the website
----------------------

The website at http://openlayers.org/ol-cesium/ is built using GitHub's [Automatic Page Generator](https://github.com/openlayers/ol-cesium/generated_pages/new), with the Architect theme. The page should be regenerated any time `README.md` changes. Please follow the instructions in the HTML comment block at the top of the content editor when updating the content of the web site.

To update the distribution artifacts (build, examples, API docs), go to the root of the repository, and invoke

    $ build/publish-website.sh

This will build the distribution artifacts and will publish them to the website.
