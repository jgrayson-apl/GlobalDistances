/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "calcite",
  "boilerplate/ItemHelper",
  "boilerplate/UrlParamHelper",
  "dojo/i18n!./nls/resources",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/colors",
  "dojo/number",
  "dojo/query",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "dstore/Memory",
  "dstore/Trackable",
  "dstore/SimpleQuery",
  "dgrid/OnDemandList",
  "dgrid/Selection",
  "esri/identity/IdentityManager",
  "esri/request",
  "esri/core/lang",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/portal/Portal",
  "esri/Map",
  "esri/Viewpoint",
  "esri/views/MapView",
  "esri/layers/Layer",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/geometry/SpatialReference",
  "esri/tasks/GeometryService",
  "esri/tasks/support/ProjectParameters",
  "esri/geometry/geometryEngine",
  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/geometry/Polygon",
  "esri/geometry/Extent",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/ObjectSymbol3DLayer",
  "esri/symbols/LineSymbol3D",
  "esri/symbols/LineSymbol3DLayer",
  "esri/symbols/SimpleLineSymbol",
  "esri/layers/support/LabelClass",
  "esri/symbols/LabelSymbol3D",
  "esri/symbols/TextSymbol3DLayer",
  "esri/layers/support/RasterFunction",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "./Firefly/FireflyLineSymbol3D",
  "./Firefly/FireflyPolygonSymbol3D"
], function (calcite, ItemHelper, UrlParamHelper, i18n, declare, lang, array, Color, colors, number, query, on,
             dom, domAttr, domClass, domGeom, domConstruct, Memory, Trackable, SimpleQuery, OnDemandList, Selection,
             IdentityManager, esriRequest, esriLang, watchUtils, promiseUtils, Portal, esriMap, Viewpoint, MapView,
             Layer, FeatureLayer, Graphic, SpatialReference, GeometryService, ProjectParameters,
             geometryEngine, Point, Polyline, Polygon, Extent,
             SimpleRenderer, PointSymbol3D, ObjectSymbol3DLayer, LineSymbol3D, LineSymbol3DLayer, SimpleLineSymbol,
             LabelClass, LabelSymbol3D, TextSymbol3DLayer, RasterFunction,
             Home, Search, BasemapGallery, Expand,
             FireflyLineSymbol3D, FireflyPolygonSymbol3D) {

  const TrackableMemory = declare([Memory, Trackable, SimpleQuery]);
  const SelectableList = declare([OnDemandList, Selection]);

  return declare(null, {

    config: null,
    direction: null,

    /**
     *
     */
    constructor() {
      calcite.init();
    },

    /**
     *
     * @param boilerplateResponse
     */
    init: function (boilerplateResponse) {
      if(boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        const boilerplateResults = boilerplateResponse.results;
        const webMapItem = boilerplateResults.webMapItem;
        const webSceneItem = boilerplateResults.webSceneItem;
        const groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if(webMapItem) {
          this._createWebMap(webMapItem);
        } else if(webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if(groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    /**
     *
     * @param error
     * @returns {*}
     */
    reportError: function (error) {
      // remove loading class from body
      //domClass.remove(document.body, CSS.loading);
      //domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      let node = dom.byId("loading_message");
      if(node) {
        //node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        node.innerHTML = "<h1><span></span>" + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    /**
     *
     * @private
     */
    _setDirection: function () {
      let direction = this.direction;
      let dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    /**
     *
     * @param webMapItem
     * @private
     */
    _createWebMap: function (webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/MapView"], function (MapView) {

          let view = new MapView(viewProperties);
          view.then(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);

        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param webSceneItem
     * @private
     */
    _createWebScene: function (webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/SceneView"], function (SceneView) {

          let view = new SceneView(viewProperties);
          view.then(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);
        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param groupData
     * @private
     */
    _createGroupGallery: function (groupData) {
      let groupInfoData = groupData.infoData;
      let groupItemsData = groupData.itemsData;

      if(!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      let info = groupInfoData.results[0];
      let items = groupItemsData.results;

      this._ready();

      if(info && items) {
        let html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    },

    /**
     *
     * @private
     */
    _ready: function (view) {

      // TITLE //
      document.title = dom.byId("app-title-node").innerHTML = this.config.title;

      //
      // WIDGETS IN VIEW UI //
      //

      // LEFT PANE TOGGLE //
      const toggleLeftPaneNode = domConstruct.create("div", { title: "Toggle Left Panel", className: "esri-widget-button esri-icon-collapse" });
      view.ui.add(toggleLeftPaneNode, { position: "top-left", index: 0 });
      on(toggleLeftPaneNode, "click", function () {
        query(".ui-layout-left").toggleClass("hide");
        query(".ui-layout-center").toggleClass("column-18");
        query(".ui-layout-center").toggleClass("column-24");
        domClass.toggle(toggleLeftPaneNode, "esri-icon-collapse esri-icon-expand");
      }.bind(this));

      // HOME //
      const homeWidget = new Home({ view: view });
      view.ui.add(homeWidget, { position: "top-left", index: 1 });


      //
      // WIDGETS IN EXPAND //
      //

      // BASEMAP GALLERY //
      const basemapGallery = new BasemapGallery({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND BASEMAP GALLERY //
      const basemapGalleryExpand = new Expand({
        view: view,
        content: basemapGallery.domNode,
        expandIconClass: "esri-icon-basemap",
        expandTooltip: "Basemap"
      }, domConstruct.create("div"));
      view.ui.add(basemapGalleryExpand, "top-right");

      // GLOBAL DISTANCES //
      this.initializeGlobalDistances(view);

    },

    /**
     *
     * @param view
     */
    initializeGlobalDistances: function (view) {

      this.initializeCountryList(view).then(() => {
        this.initializeRangeGraphic(view);
        this.initializeAnalysisLocation(view);
        //this.initializePopulationLayer(view);
      });

    },

    /**
     *
     * @param view
     */
    initializeAnalysisLocation: function (view) {

      const locationSymbol = new PointSymbol3D({
        symbolLayers: [
          new ObjectSymbol3DLayer({
            width: 100000,
            // depth: 500000,
            height: 200000,
            anchor: "bottom",
            resource: { primitive: "sphere" },
            material: { color: Color.named.red }
          })
        ]
      });
      let locationGraphic = new Graphic({ symbol: locationSymbol });
      view.graphics.add(locationGraphic);

      const updateLocationGraphic = (location) => {
        view.graphics.remove(locationGraphic);
        locationGraphic = locationGraphic.clone();
        locationGraphic.geometry = location.clone();
        view.graphics.add(locationGraphic);
      };

      const setAnalysisLocation = (location) => {
        this.location = location;
        updateLocationGraphic(this.location);
        if(this.hasAEView) {
          this.updateAzEqView(this.location);
        }
        this.updateRangeAnalysis(view);

        dom.byId("location-coords-node").value = lang.replace("Lon: {lon}  Lat: {lat}", {
          lon: this.location.longitude.toFixed(5),
          lat: this.location.latitude.toFixed(5)
        });
      };

      watchUtils.whenDefinedOnce(view, "extent", (extent) => {
        setAnalysisLocation(extent.center);
      });

      view.on("click", (evt) => {
        evt.stopPropagation();
        setAnalysisLocation(evt.mapPoint);
      });

      // SEARCH //
      const searchWidget = new Search({ view: view, autoSelect: false });
      view.ui.add(searchWidget, { position: "top-right", index: 0 });

      searchWidget.on("search-complete", (evt) => {
        const result = evt.results["0"].results["0"];
        view.goTo({ target: result.extent.center, zoom: 4 }, { speedFactor: 0.33, easing: "in-out-cubic" }).then(() => {
          setAnalysisLocation(result.extent.center);
        });
      });
    },

    /**
     *
     * @param view
     */
    initializeCountryList: function (view) {

      // cities = "6996f03a1b364dbab4008d99380370ed"

      /*
       this.calcGeodesicDistance = (locationA, locationB) => {
       return geometryEngine.geodesicLength(new Polyline({
       spatialReference: view.spatialReference,
       paths: [
       [locationA.x, locationA.y],
       [locationB.x, locationB.y]
       ]
       }));
       };
       */

      this.countriesLayer = view.map.layers.find((layer) => {
        return (layer.title === "World Countries");
      });
      return this.countriesLayer.load().then(() => {

        // AZIMUTHAL EQUIDISTANT VIEW //
        //this.initializeAzimuthalEquidistantView(view, this.countriesLayer);

        const countrySymbol = this.countriesLayer.renderer.symbol.symbolLayers.getItemAt(0);
        let fireflyCountrySymbol = null;
        try {
          fireflyCountrySymbol = new FireflyPolygonSymbol3D({
            color: countrySymbol.outline.color,
            size: 3.5
          });
        } catch (error) {
          console.error(error);
        }
        this.countriesLayer.renderer = new SimpleRenderer({ symbol: fireflyCountrySymbol });

        const rangeQuery = this.countriesLayer.createQuery();
        return this.countriesLayer.queryFeatures(rangeQuery).then((featureSet) => {

          const countryFeatures = esriLang.clone(featureSet.features);
          countryFeatures.forEach((countryFeature) => {
            countryFeature.id = countryFeature.getAttribute("ISO");
            countryFeature.distance = Infinity;
          });
          const totalCountries = countryFeatures.length;

          this.countryStore = new TrackableMemory({ data: countryFeatures });
          const countryFilter = new this.countryStore.Filter();

          this.countryList = new SelectableList({
            className: "dgrid-autoheight",
            noDataMessage: "No Countries",
            selectionMode: "single",
            sort: "distance",
            renderRow: (countryInfo) => {

              const countryNode = domConstruct.create("div", {
                className: "side-nav-link font-size--3",
                title: countryInfo.getAttribute("ISO")
              });

              domConstruct.create("span", {
                className: "avenir-italic right",
                innerHTML: number.format(countryInfo.distance)
              }, countryNode);

              domConstruct.create("span", {
                innerHTML: countryInfo.getAttribute("COUNTRYAFF")
              }, countryNode);

              return countryNode;
            }
          }, domConstruct.create("div", {}, "country-list"));
          this.countryList.startup();

          view.whenLayerView(this.countriesLayer).then((countriesLayerView) => {

            view.highlightOptions = {
              color: new Color("#2493f2"),
              haloOpacity: 0.8,
              fillOpacity: 0.4
            };

            const clearHighlight = () => {
              if(this.highlightHandle) {
                this.highlightHandle.remove();
              }
            };

            this.countryList.on("dgrid-select", (evt) => {
              const selectedCountryInfo = evt.rows[0].data;
              this.highlightHandle = countriesLayerView.highlight(selectedCountryInfo);
            });
            this.countryList.on("dgrid-deselect", clearHighlight);
            this.countryList.on("dgrid-refresh-complete", clearHighlight);
          });


          this.updateCountryList = () => {
            const distanceFilter = countryFilter.lt("distance", this.distanceKms);
            const withinDistanceFilter = this.countryStore.filter(distanceFilter);
            this.countryList.set("collection", withinDistanceFilter);
            withinDistanceFilter.fetch().then((countriesWithinDistance) => {
              dom.byId("country-count-label").innerHTML = lang.replace("{within} of {total}", {
                within: number.format(countriesWithinDistance.length, { places: 0 }),
                total: totalCountries
              });
            });
          };

        });
      });

    },

    /**
     *
     * @param view
     * @param countriesLayer
     */
    initializeAzimuthalEquidistantView: function (view, countriesLayer) {

      //const geomService = new GeometryService({ url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer" });

      const ae_wktTemplate = 'PROJCS["AzEq",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433],METADATA["World",-180.0,-90.0,180.0,90.0,0.0,0.0174532925199433,0.0,1262]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",{Central_Meridian}],PARAMETER["Latitude_Of_Origin",{Latitude_Of_Origin}],UNIT["Meter",1.0]]';

      const createAzimuthalEquidistant = (lon, lat) => {
        return new SpatialReference({
          wkt: lang.replace(ae_wktTemplate, {
            "Central_Meridian": lon,
            "Latitude_Of_Origin": lat
          })
        });
      };


      this.updateAzEqView = (location) => {

        const ae_SR = createAzimuthalEquidistant(location.longitude, location.latitude);
        const ae_initialExtent = new Extent({
          xmin: -21441540.21270714,
          ymin: -23079703.217770502,
          xmax: 21749783.327468682,
          ymax: 23529638.732059523,
          spatialReference: ae_SR
        });

        const mapContainer = domConstruct.create("div", { className: "map-view" });
        view.ui.empty("bottom-right");
        view.ui.add(mapContainer, "bottom-right");

        const ae_countriesLayer = new FeatureLayer({ url: countriesLayer.url });

        const ae_view = new MapView({
          container: mapContainer,
          ui: { components: [] },
          spatialReference: ae_SR,
          extent: ae_initialExtent,
          map: new esriMap({
            layers: [ae_countriesLayer]
          })
        });

      };

      this.updateAzEqView(view.extent.center);

      this.hasAEView = true;

    },

    /**
     * World Population Estimated 2015
     * - http://apl.maps.arcgis.com/home/item.html?id=2417dafad0b54276a2333d76a0b27311
     * - http://resources.arcgis.com/en/help/arcgis-rest-api/#/Raster_Function_Objects/02r3000000rv000000/
     *
     * @param view
     */
    initializePopulationLayer: function (view) {

      Layer.fromPortalItem({ id: "2417dafad0b54276a2333d76a0b27311" }).then((layer) => {

        layer.load().then(() => {
          layer.format = "lerc";

          /*esriRequest.setRequestPreCallback((ioArgs) => {
           if(ioArgs.url.startsWith(layer.url) && ioArgs.url.endsWith("/exportImage")) {
           if(ioArgs.content.renderingRule) {
           if(ioArgs.content.renderingRule !== JSON.stringify(layer.renderingRule.toJSON())) {
           ioArgs.content.renderingRule = JSON.stringify(layer.renderingRule.toJSON());
           }
           }
           }
           return ioArgs;
           });*/

          const populationEstimateNode = domConstruct.create("div", { className: "font-size-4 text-red" });
          view.ui.add(populationEstimateNode, "bottom-left");


          const getPopulationEstimate = (pixelData) => {
            if((pixelData == null) || (pixelData.pixelBlock == null) || (pixelData.pixelBlock.pixels == null)) {
              return;
            }
            const noData = pixelData.pixelBlock.statistics[0].noDataValue;
            return pixelData.pixelBlock.pixels[0].reduce((popEstimate, pixel) => {
              if(pixel !== noData) {
                popEstimate += pixel;
              }
              return popEstimate;
            }, 0);
          };


          this.updatePopulationEstimate = (geometry) => {

            const clippingGeometry = new Polygon({
              spatialReference: geometry.spatialReference,
              rings: geometry.paths
            });

            layer.renderingRule = new RasterFunction({
              functionName: "Clip",
              functionArguments: {
                "ClippingGeometry": clippingGeometry.toJSON(),
                "ClippingType": 1
              }
            });

            const widthPixels = (clippingGeometry.extent.width / view.extent.width) * view.width;
            const heightPixels = (clippingGeometry.extent.height / view.extent.height) * view.height;
            layer.fetchImage(clippingGeometry.extent, widthPixels, heightPixels).then((fetchImageResponse) => {
              //layer.fetchImage(view.extent, view.width, view.height).then((fetchImageResponse) => {

              const populationEstimate = getPopulationEstimate(fetchImageResponse.pixelData);
              populationEstimateNode.innerHTML = "Population Estimate: " + number.format(populationEstimate);

            }).otherwise((error) => {
              console.warn(error);
            });

          };

        });
      });


    },

    /**
     *
     * @param view
     */
    initializeRangeGraphic: function (view) {

      // DISTANCE KMS //
      this.distanceKms = dom.byId("distance-input").valueAsNumber;

      // FIREFLY LINE SYMBOL //
      const rangeSymbol = new FireflyLineSymbol3D({
        color: Color.named.red,
        size: 9
      });

      /*const rangeSymbol = new LineSymbol3D({
        symbolLayers: [
          {
            type: "line",
            material: { color: Color.named.white.concat(0.9) },
            size: 1.5
          },
          {
            type: "line",
            material: { color: Color.named.red.concat(0.4) },
            size: 9
          }
        ]
      });*/

      // RANGE LAYER //
      const rangeLayer = new FeatureLayer({
        title: "Range",
        spatialReference: view.spatialReference,
        geometryType: "polyline",
        elevationInfo: { mode: "on-the-ground" },
        objectIdField: "ObjectID",
        fields: [
          {
            name: "ObjectID",
            alias: "ObjectID",
            type: "oid"
          },
          {
            name: "label",
            alias: "Label",
            type: "string"
          },
          {
            name: "distance",
            alias: "Distance Kms",
            type: "double"
          }
        ],
        source: [],
        labelsVisible: true,
        labelingInfo: [
          new LabelClass({
            labelExpressionInfo: {
              value: "{label} Kms"
            },
            labelPlacement: "center-center",
            symbol: new LabelSymbol3D({
              symbolLayers: [
                new TextSymbol3DLayer({
                  material: { color: Color.named.white },
                  size: 13,
                  font: {
                    style: "normal",
                    weight: "bold",
                    family: "Avenir Next W00"
                  }
                })
              ]
            })
          })
        ],
        renderer: new SimpleRenderer({ symbol: rangeSymbol })
      });
      view.map.add(rangeLayer);

      this.updateRangeGraphics = (rangeInfos) => {
        rangeLayer.source.removeAll();
        const rangeGraphics = rangeInfos.map((rangeInfo) => {
          return new Graphic({
            geometry: rangeInfo.geometry,
            attributes: { label: number.format(rangeInfo.distance) }
          });
        });
        rangeLayer.source.addMany(rangeGraphics);
      };

      on(dom.byId("distance-slider"), "input", () => {
        dom.byId("distance-input").valueAsNumber = dom.byId("distance-slider").valueAsNumber;
        this.updateRangeAnalysis(view);
      });
      on(dom.byId("distance-input"), "input", () => {
        dom.byId("distance-slider").valueAsNumber = dom.byId("distance-input").valueAsNumber;
        this.updateRangeAnalysis(view);
      });

    },

    /**
     *
     */
    updateRangeAnalysis: function (view) {

      if(this.analysisHandle && !this.analysisHandle.isFulfilled()) {
        this.analysisHandle.cancel();
      }


      // UPDATE RANGE GRAPHIC //
      this.distanceKms = dom.byId("distance-input").valueAsNumber;

      //this.rangeGeometry = geometryEngine.geodesicBuffer(this.location, this.distanceKms, "kilometers");
      //this.updateRangeGraphic(this.rangeGeometry, this.distanceKms);

      const ringStep = 1500;
      let ringDistances = [this.distanceKms];
      const ringCount = Math.floor(this.distanceKms / ringStep);
      if(ringCount > 0) {
        ringDistances = Array(ringCount).fill().map((_, i) => (i + 1) * ringStep);
        if(ringDistances.indexOf(this.distanceKms) === -1) {
          ringDistances.push(this.distanceKms);
        }
      }

      // RANGE INFOS //
      const rangeInfoHandles = ringDistances.map((ringDistance) => {
        // RANGE BUFFER //
        const rangeBuffer = geometryEngine.geodesicBuffer(this.location, ringDistance, "kilometers");
        // RANGE INFO //
        return promiseUtils.resolve({
          geometry: this.datelineFilter(rangeBuffer),
          distance: ringDistance
        })
      });
      this.analysisHandle = promiseUtils.eachAlways(rangeInfoHandles).then((rangeInfoResults) => {

        // RESULTS //
        const rangeInfos = rangeInfoResults.map((rangeInfoResult) => {
          return rangeInfoResult.value;
        });

        // UPDATE RANGE GRAPHICS //
        this.updateRangeGraphics(rangeInfos);

        // UPDATE POPULATION ESTIMATE //
        //const clippingGeometry = rangeInfos[rangeInfos.length - 1].geometry;
        //this.updatePopulationEstimate(clippingGeometry);


        // CALC DISTANCES //
        this.countryStore.forEach((countryInfo) => {
          countryInfo.distance = Math.floor(this.geodesicDistance(countryInfo.geometry, this.location, "kilometers"));
          this.countryStore.putSync(countryInfo);
        });
        this.updateCountryList();

      });

    },

    /**
     *
     * @param geometry {Geometry}
     * @param inputPoint {Point}
     * @param unit {String | Number}
     */
    geodesicDistance: function (geometry, inputPoint, unit) {

      const nearestCoordinate = (geometry.type === "point") ? geometry : geometryEngine.nearestCoordinate(geometry, inputPoint).coordinate;

      const nearestArc = new Polyline({
        spatialReference: SpatialReference.WGS84,
        paths: [[
          [inputPoint.longitude, inputPoint.latitude],
          [nearestCoordinate.longitude, nearestCoordinate.latitude]
        ]]
      });

      return geometryEngine.geodesicLength(nearestArc, unit || "meters");
    },

    /**
     *  DATELINE FILTER
     *
     * @param geometry {Polygon | Polyline}
     * @returns {Polyline}
     */
    datelineFilter: function (geometry) {

      // RESULT GEOMETRY //
      const resultPolyline = new Polyline({
        spatialReference: geometry.spatialReference,
        paths: []
      });

      // DATELINE //
      const dateline = 180.0;

      // GEOMETRY PARTS //
      const geometryParts = (geometry.paths || geometry.rings);
      if(geometryParts) {
        geometryParts.forEach((part, partIndex) => {
          let newPart = [];
          part.forEach((coords, coordsIdx) => {
            // IS POINT CLOSE TO DATELINE //
            const pnt = geometry.getPoint(partIndex, coordsIdx);
            if((dateline - Math.abs(pnt.longitude)) < 0.0000001) {
              // FINISH PART //
              if(newPart.length > 1) {
                // ADD TO PART //
                newPart.push(coords);
                // ADD PART TO RESULT //
                resultPolyline.paths.push(newPart);
              }
              // START NEW PART //
              newPart = [coords]
            } else {
              // ADD TO PART //
              newPart.push(coords);
            }
          });
          if(newPart.length > 1) {
            // ADD PART TO RESULT //
            resultPolyline.paths.push(newPart);
          }
        });
      }

      return resultPolyline;
    }

  });
});


/**
 * view-source:http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/gpx/test-v3.html
 *
 * @param polyline
 * @returns {*}
 */
/*denormalizePolyline: function (polyline) {

 const denormalized_paths = polyline.paths.map((path, pathIndex) => {

 let prevPoint = polyline.getPoint(pathIndex, 0);
 let actualDir = prevPoint.x < 0 ? -1 : 1;

 const denormalized_path = [[prevPoint.x, prevPoint.y]];

 for (let coordsIndex = 1; coordsIndex < path.length; coordsIndex++) {
 //path.forEach((coords, coordsIndex) => {
 //if(coordsIndex > 0) {

 const thisPoint = polyline.getPoint(pathIndex, coordsIndex);
 const dir = thisPoint.x < 0 ? -1 : 1;
 const prevDir = prevPoint.x < 0 ? -1 : 1;
 console.log(prevDir, actualDir, dir);

 let cmpDir;
 if(prevDir !== dir) {
 cmpDir = prevDir;
 } else if(actualDir !== dir) {
 cmpDir = actualDir;
 }

 if(cmpDir) {
 console.log((cmpDir < 0 ? "-ve" : "+ve") + " to " + (dir < 0 ? "-ve" : "+ve"));
 console.log(prevPoint.x, thisPoint.x);

 let diff;
 while ((diff = Math.abs(prevPoint.x - thisPoint.x)) > 40075016.68557781) {
 if(prevDir < 0) {
 thisPoint.x -= 40075016.68557781;
 } else {
 thisPoint.x += 40075016.68557781;
 }
 }

 const arc = new Polyline({
 spatialReference: polyline.spatialReference,
 paths: [[
 [prevPoint.x, prevPoint.y],
 [thisPoint.x, thisPoint.y]
 ]]
 });

 const euclidean = geometryEngine.planarLength(arc, "meters");
 console.log("euclidean = " + euclidean);
 const geodesic = geometryEngine.geodesicLength(arc, "meters");
 console.log("geodesic = " + geodesic);

 if(geodesic < euclidean) {
 const denormalized_x = (prevDir < 0) ? (thisPoint.x - 40075016.68557781) : (thisPoint.x + 40075016.68557781);

 const denormalizedArc = new Polyline({
 spatialReference: polyline.spatialReference,
 paths: [[
 [prevPoint.x, prevPoint.y],
 [denormalized_x, thisPoint.y]
 ]]
 });
 const euclidean2 = geometryEngine.planarLength(denormalizedArc, "meters");
 console.log("euclidean 2 = " + euclidean2);

 if(euclidean2 <= euclidean) {
 console.log("denormalizing... " + denormalized_x);
 actualDir = thisPoint.x < 0 ? -1 : 1;
 thisPoint.x = denormalized_x;
 }
 }
 }

 denormalized_path.push([thisPoint.x, thisPoint.y]);
 prevPoint = thisPoint.clone();
 }
 //});

 return denormalized_path;
 });

 return new Polyline({
 spatialReference: polyline.spatialReference,
 paths: denormalized_paths
 });
 }*/