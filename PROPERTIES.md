# OLCEsium Properties

## olcs_extruded_height
Value: number
The distance in meters between the polygon's extruded face and the ellipsoid surface.
Check buildings example for usage in context.

## olcs_shadows
Value: boolean
Enables shadow casting in 3D. Can be either applied to the entire feature set or by feature individually.
In order for it to work, [shadowMap](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html?classFilter=scene#shadowMap) needs to be enabled in the Cesium scene. To use the sun as light source, enable [enableLighting](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html#enableLighting) on the Globe.
Check buildings example for usage in context.

## olcs_model
Value: object({cesiumOptions: options})
Is used to define the 3D model representation of an OpenLayers vector feature in the Cesium scene. This property allows you to customize how the feature is visualized and positioned in the 3D world.

To use the olcs_model property, set it as a property on your OpenLayers vector feature. It should be an object that specifies the properties of the 3D model. The olcs_model object can have the following key-value pairs:

- url: The URL of the 3D model's data source (required).
- scale: A numeric value representing the scale of the model (optional).
- minimumPixelSize: The minimum pixel size at which the model will be visible (optional).
- heightReference: Specifies how the model's height is interpreted in the scene (optional).

Check vectors example for usage in context.

## olcs_skip
Value: boolean
Allows you to exclude specific layers from being rendered in the Cesium 3D view. This can be useful when you want to control which layers are displayed in the 2D map view and which are displayed in the 3D Cesium view.

## olcs_minimumLevel
Value: number
Allows you to set a minimum zoom level for rendering 3D tiles in the Cesium view. This property helps to control the level of detail displayed in the 3D view based on the current zoom level.
Check mvt example for usage in context.

## olcs_tileLoadFunction (ImageWMS sources)
Value: https://openlayers.org/en/latest/apidoc/module-ol_Tile.html#~LoadFunction
Allows to use a custom function, for example when converting a WMS image source to a tiled one.

## olcs_projection
Value: https://openlayers.org/en/latest/apidoc/module-ol_proj_Projection-Projection.html
Allows to use an alternative projection in CesiumJS. See the customProj example.

## olcs_polygon_kind
Value: "rectangle"
Allows to use the Cesium Rectangle geometry instead of a polygon geometry. See the vector example.

## olcs_3d_geometry (OL vector source)
Value: https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry-Geometry.html
Allows to use an alternative geometry in CesiumJS.

## olcs_proxy
Value: https://cesium.com/learn/cesiumjs/ref-doc/Proxy.html
Allows to add authentication information to requests sent by CesiumJS or manipulate request.

## olcs_extent
Value: An array of numbers representing an extent: [minx, miny, maxx, maxy]
Allows to restrict a tiled imagery layer to a rectangle. This avoid sending useless requests.
