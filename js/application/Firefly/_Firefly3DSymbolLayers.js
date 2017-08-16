/**
 *
 * Firefly3DSymbolLayers
 *  - Esri LineSymbol3DLayer(s) using Firefly symbology
 *  - https://nation.maps.arcgis.com/apps/Cascade/index.html?appid=1b39896bff9946519b53883106ff2838
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  8/14/2017 - 0.0.1 -
 * Modified:
 *
 */
define([
  "esri/core/Accessor",
  "esri/symbols/LineSymbol3DLayer",
  "dojo/_base/Color",
  "dojo/colors"
], function (Accessor, LineSymbol3DLayer, Color, colors) {

  /**
   *
   */
  const Firefly3DSymbolLayers = Accessor.createSubclass({

    properties: {
      color: {
        value: Color.named.black
      },
      size: {
        value: 5
      },
      steps: {
        value: 5
      }
    },

    /**
     *  https://nation.maps.arcgis.com/apps/Cascade/index.html?appid=1b39896bff9946519b53883106ff2838
     *
     * @returns {Array.<LineSymbol3DLayer>}
     */
    createFireflyLineSymbol3DLayers: function () {

      const fireflyColor = new Color(this.color);
      fireflyColor.a = 0.1;

      const stepSize = (this.size / this.steps);
      const centerLayer = new LineSymbol3DLayer({ size: (stepSize * 1.5), material: { color: Color.named.white.concat(0.7) } });
      const lineSizes = Array(this.steps).fill().map((_, i) => (i + 1) * (stepSize * 2));
      const fireflyLayers = lineSizes.map((lineSize) => {
        return new LineSymbol3DLayer({ size: lineSize, material: { color: fireflyColor } })
      });

      return fireflyLayers.concat(centerLayer);
    }

  });

  Firefly3DSymbolLayers.version = "0.0.1";

  return Firefly3DSymbolLayers;
});