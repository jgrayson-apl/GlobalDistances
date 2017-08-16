/**
 *
 * FireflyLineSymbol3D
 *  - Esri LineSymbol3D using Firefly symbology
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  8/14/2017 - 0.0.1 -
 * Modified:
 *
 */
define([
  "esri/symbols/LineSymbol3D",
  "./_Firefly3DSymbolLayers"
], function (LineSymbol3D, _Firefly3DSymbolLayers) {

  /**
   *
   */
  const FireflyLineSymbol3D = LineSymbol3D.createSubclass([_Firefly3DSymbolLayers], {

    properties: {
      symbolLayers: {
        dependsOn: ["color", "size", "steps"],
        get: function () {
          return this.createFireflyLineSymbol3DLayers()
        }
      }
    }  

  });

  FireflyLineSymbol3D.version = "0.0.1";

  return FireflyLineSymbol3D;
});