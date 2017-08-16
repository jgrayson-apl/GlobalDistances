/**
 *
 * FireflyPolygonSymbol3D
 *  - Esri PolygonSymbol3D using Firefly symbology
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  8/14/2017 - 0.0.1 -
 * Modified:
 *
 */
define([
  "esri/symbols/PolygonSymbol3D",
  "./_Firefly3DSymbolLayers"
], function (PolygonSymbol3D, _Firefly3DSymbolLayers) {

  const FireflyPolygonSymbol3D = PolygonSymbol3D.createSubclass([_Firefly3DSymbolLayers], {

    properties: {
      symbolLayers: {
        dependsOn: ["color", "size", "steps"],
        get: function () {
          return this.createFireflyLineSymbol3DLayers()
        }
      }
    }

  });

  FireflyPolygonSymbol3D.version = "0.0.1";

  return FireflyPolygonSymbol3D;
});