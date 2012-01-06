/*
 * lvector.Layer is a base class for rendering vector layers on a Leaflet map. It's inherited by AGS, A2E, CartoDB, GeoIQ, etc.
 */

lvector.Layer = lvector.Class.extend({
    
    //
    // Default options for all layers
    //
    options: {
        fields: "",
        scaleRange: null,
        map: null,
        uniqueField: null,
        visibleAtScale: true,
        dynamic: false,
        autoUpdate: false,
        autoUpdateInterval: null,
        popupTemplate: null,
        singlePopup: false,
        symbology: null,
        showAll: false
    },

    initialize: function(options) {
        lvector.Util.setOptions(this, options);
    },
    
    //
    // Show this layer on the map provided
    //
    setMap: function(map) {
        if (map && this.options.map) {
            return;
        }
        this.options.map = map;
        if (map && this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
            var z = this.options.map.getZoom();
            var sr = this.options.scaleRange;
            this.options.visibleAtScale = (z >= sr[0] && z <= sr[1]);
        }
        this[map ? "_show" : "_hide"]();
    },
    
    //
    // Get the map (if any) that the layer has been added to
    //
    getMap: function() {
        return this.options.map;
    },
    
    setOptions: function(o) {
        // TODO - Merge new options (o) with current options (this.options)
    },
    
    _show: function() {
        this._addIdleListener();
        if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
            this._addZoomChangeListener();
        }
        if (this.options.visibleAtScale) {
            if (this.options.autoUpdate && this.options.autoUpdateInterval) {
                var me = this;
                this._autoUpdateInterval = setInterval(function() {
                    me._getFeatures();
                }, this.options.autoUpdateInterval);
            }
            this.options.map.fire("moveend").fire("zoomend");
        }
    },
    
    _hide: function() {
        if (this._idleListener) {
            this.options.map.off("moveend", this._idleListener);
        }
        if (this._zoomChangeListener) {
            google.maps.event.removeListener(this._zoomChangeListener);
        }
        if (this._autoUpdateInterval) {
            clearInterval(this._autoUpdateInterval);
        }
        this._clearFeatures();
        this._lastQueriedBounds = null;
        if (this._gotAll) {
            this._gotAll = false;
        }
    },
    
    //
    // Hide the vectors in the layer. This might get called if the layer is still on but out of scaleRange.
    //
    _hideVectors: function() {
        for (var i = 0; i < this._vectors.length; i++) {
            if (this._vectors[i].vector) {
                this.options.map.removeLayer(this._vectors[i].vector);
                if (this._vectors[i].infoWindow) {
                    this._vectors[i].infoWindow.close()
                } else if (this.infoWindow && this.infoWindow.get("associatedFeature") && this.infoWindow.get("associatedFeature") == this._vectors[i]) {
                    this.infoWindow.close();
                    this.infoWindow = null;
                }
            }
            if (this._vectors[i].vectors && this._vectors[i].vectors.length) {
                for (var i2 = 0; i2 < this._vectors[i].vectors.length; i2++) {
                    this.options.map.removeLayer(this._vectors[i].vectors[i2]);
                    if (this._vectors[i].vectors[i2].infoWindow) {
                        this._vectors[i].vectors[i2].infoWindow.close();
                    } else if (this.infoWindow && this.infoWindow.get("associatedFeature") && this.infoWindow.get("associatedFeature") == this._vectors[i]) {
                        this.infoWindow.close();
                        this.infoWindow = null;
                    }
                }
            }
        }
    },
    
    //
    // Show the vectors in the layer. This might get called if the layer is on and came back into scaleRange.
    //
    _showVectors: function() {
        for (var i = 0; i < this._vectors.length; i++) {
            if (this._vectors[i].vector) {
                this.options.map.addLayer(this._vectors[i].vector);
            }
            if (this._vectors[i].vectors && this._vectors[i].vectors.length) {
                for (var i2 = 0; i2 < this._vectors[i].vectors.length; i2++) {
                    this.options.map.addLayer(this._vectors[i].vectors[i2]);
                }
            }
        }
    },
    
    //
    // Hide the vectors, then empty the vectory holding array
    //
    _clearFeatures: function() {
        // TODO - Check to see if we even need to hide these before we remove them from the DOM
        this._hideVectors();
        this._vectors = [];
    },
    
    //
    // Add an event hanlder to detect a zoom change on the map
    //
    _addZoomChangeListener: function() {
        //
        // "this" means something different inside the on method. Assign it to "me".
        //
        var me = this;
        
        this.options.map.on("zoomend", me._zoomChangeListener, me);
    },
    
    _zoomChangeListener: function() {
        //
        // Whenever the map's zoom changes, check the layer's visibility (this.options.visibleAtScale)
        //
        this._checkLayerVisibility();
    },
    
    //
    // This gets fired when the map is panned or zoomed
    //
    _idleListener: function() {
        if (this.options.visibleAtScale) {
            //
            // Do they use the showAll parameter to load all features once?
            //
            if (this.options.showAll) {
                //
                // Have we already loaded these features
                //
                if (!this._gotAll) {
                    //
                    // Grab the features and note that we've already loaded them (no need to _getFeatures again
                    //
                    this._getFeatures();
                    this._gotAll = true;
                }
            } else {
                this._getFeatures();
            }
        }
    },
    
    //
    // Add an event hanlder to detect an idle (pan or zoom) on the map
    //
    _addIdleListener: function() {
        //
        // "this" means something different inside the on method. Assign it to "me".
        //
        var me = this;
        
        //
        // Whenever the map idles (pan or zoom) get the features in the current map extent
        //
        this.options.map.on("moveend", this._idleListener, me);
    },
    
    //
    // Get the current map zoom and check to see if the layer should still be visible
    //
    _checkLayerVisibility: function() {
        //
        // Store current visibility so we can see if it changed
        //
        var visibilityBefore = this.options.visibleAtScale;
        
        //
        // Check current map scale and see if it's in this layer's range
        //
        var z = this.options.map.getZoom();
        var sr = this.options.scaleRange;
        this.options.visibleAtScale = (z >= sr[0] && z <= sr[1]);
        
        //
        // Check to see if the visibility has changed
        //
        if (visibilityBefore !== this.options.visibleAtScale) {
            //
            // It did, hide or show vectors
            //
            this[this.options.visibleAtScale ? "_showVectors" : "_hideVectors"]();
        }
        
        //
        // Check to see if we need to set or clear any intervals for auto-updating layers
        //
        if (visibilityBefore && !this.options.visibleAtScale && this._autoUpdateInterval) {
            clearInterval(this._autoUpdateInterval);
        } else if (!visibilityBefore && this.options.autoUpdate && this.options.autoUpdateInterval) {
            var me = this;
            this._autoUpdateInterval = setInterval(function() {
                me._getFeatures();
            }, this.options.autoUpdateInterval);
        }
        
    },
    
    //
    // Set the InfoWindow content for the feature
    //
    _setPopupContent: function(feature) {
        //
        // Store previous Popup content so we can check to see if it changed. If it didn't no sense changing the content as this has an ugly flashing effect.
        //
        var previousContent = feature.popupContent
        
        //
        // Esri calls them attributes. GeoJSON calls them properties.
        //
        var atts = feature.attributes || feature.properties
        
        var popupContent;
        
        //
        // Check to see if it's a string-based popupTemplate or function
        //
        if (typeof this.options.popupTemplate == "string") {
            //
            // Store the string-based popupTemplate
            //
            popupContent = this.options.popupTemplate;
            
            //
            // Loop through the properties and replace mustache-wrapped property names with actual values
            //
            for (var prop in atts) {
                var re = new RegExp("{" + prop + "}", "g");
                popupContent = popupContent.replace(re, atts[prop]);
            }
        } else if (typeof this.options.popupTemplate == "function") {
            //
            // It's a function-based popupTempmlate, so just call this function and pass properties
            //
            popupContent = this.options.popupTemplate(atts);
        } else {
            //
            // Ummm, that's all we support. Seeya!
            //
            return;
        }
        
        //
        // Store the Popup content
        //
        feature.popupContent = popupContent;
        
        //
        // Check to see if popupContent has changed and if so setContent
        //
        if (feature.popup) {
            // The Popup is associated with a feature
            if (feature.popupContent !== previousContent) {
                feature.popup.setContent(feature.popupContent);
            }
        } else if (this.popup) {
            // The Popup is associated with the layer (singlePopup: true)
            if (this.popupContent !== previousContent) {
                this.popup.setContent(this.popupContent);
            }
        }
    },
    
    //
    // Show the feature's (or layer's) Popup
    //
    _showPopup: function(feature, event) {
        var popupOptions = {};
        
        //
        // Create a variable to hold a reference to the object that owns the Popup so we can show it later
        //
        var ownsPopup;
        
        //
        // If the layer isn't set to show a single Popup
        //
        if (!this.options.singlePopup) {
            //
            // Create a Popup and store it in the feature
            //
            feature.popup = new L.Popup(popupOptions, feature.vector);
            ownsPopup = feature;
        } else {
            if (this.popup) {
                //
                // If the layer already has an InfoWindow created, close and delete it
                //
                //this.infoWindow.close();
                this.options.map.removeLayer(this.popup);
                this.popup = null;
            }
            
            //
            // Create a new Popup
            //
            this.popup = new L.Popup(popupOptions, feature.vector);
            
            //
            // Store the associated feature reference in the Popup so we can close and clear it later
            //
            this.popup.associatedFeature = feature;
            
            ownsPopup = this;
        }
        
        //
        // InfoWindows on Lines and Polygons are opened slightly different, make note of it
        //
        /*var isLineOrPolygon = false;
        if (feature.vector) {
            if (feature.vector.getPaths || feature.vector.getPath) {
                isLineOrPolygon = true;
            }
        } else if (feature.vectors && feature.vectors.length) {
            if (feature.vectors[0].getPaths || feature.vectors[0].getPath) {
                isLineOrPolygon = true
            }
        }
        
        //
        // "this" means something different inside of the setTimeout function so assigned it to "me"
        //
        var me = this;
        
        //
        // Don't ask about the InfoWindow.open timeout, I'm not sure why it fails if you open it immediately
        //
        setTimeout(function() {
            ownsInfoWindow.infoWindow.open(me.options.map, isLineOrPolygon ? new google.maps.Marker({position: evt.latLng}) : feature.vector);
        }, 200);*/
        ownsPopup.popup.setLatLng(event.latlng || event.target.getLatLng());
        ownsPopup.popup.setContent(feature.popupContent);
        this.options.map.addLayer(ownsPopup.popup);
    },
    
    //
    // Get the appropriate Google Maps vector options for this feature
    //
    _getFeatureVectorOptions: function(feature) {
        //
        // Create an empty vectorOptions object to add to, or leave as is if no symbology can be found
        //
        var vectorOptions = {};
        
        //
        // Esri calls them attributes. GeoJSON calls them properties.
        //
        var atts = feature.attributes || feature.properties;
        
        //
        // Is there a symbology set for this layer?
        //
        if (this.options.symbology) {
            switch (this.options.symbology.type) {
                case "single":
                    //
                    // It's a single symbology for all features so just set the key/value pairs in vectorOptions
                    //
                    for (var key in this.options.symbology.vectorOptions) {
                        vectorOptions[key] = this.options.symbology.vectorOptions[key];
                    }
                    break;
                case "unique":
                    //
                    // It's a unique symbology. Check if the feature's property value matches that in the symbology and style accordingly
                    //
                    var att = this.options.symbology.property;
                    for (var i = 0, len = this.options.symbology.values.length; i < len; i++) {
                        if (atts[att] == this.options.symbology.values[i].value) {
                            for (var key in this.options.symbology.values[i].vectorOptions) {
                                vectorOptions[key] = this.options.symbology.values[i].vectorOptions[key];
                            }
                        }
                    }
                    break;
                case "range":
                    //
                    // It's a range symbology. Check if the feature's property value is in the range set in the symbology and style accordingly
                    //
                    var att = this.options.symbology.property;
                    for (var i = 0, len = this.options.symbology.ranges.length; i < len; i++) {
                        if (atts[att] >= this.options.symbology.ranges[i].range[0] && atts[att] <= this.options.symbology.ranges[i].range[1]) {
                            for (var key in this.options.symbology.ranges[i].vectorOptions) {
                                vectorOptions[key] = this.options.symbology.ranges[i].vectorOptions[key];
                            }
                        }
                    }
                    break;
            }
        }
        return vectorOptions;
    },
    
    //
    // Check to see if any attributes have changed
    //
    _getPropertiesChanged: function(oldAtts, newAtts) {
        var changed = false;
        for (var key in oldAtts) {
            if (oldAtts[key] != newAtts[key]) {
                changed = true;
            }
        }
        return changed;
    },
    
    //
    // Check to see if the geometry has changed
    //
    _getGeometryChanged: function(oldGeom, newGeom) {
        //
        // TODO: make this work for points, linestrings and polygons
        //
        var changed = false;
        if (oldGeom.coordinates && oldGeom.coordinates instanceof Array) {
            //
            // It's GeoJSON
            //
            
            //
            // For now only checking for point changes
            //
            if (!(oldGeom.coordinates[0] == newGeom.coordinates[0] && oldGeom.coordinates[1] == newGeom.coordinates[1])) {
                changed = true;
            }
        } else {
            //
            // It's EsriJSON
            //
            
            //
            // For now only checking for point changes
            //
            if (!(oldGeom.x == newGeom.x && oldGeom.y == newGeom.y)) {
                changed = true;
            }
        }
        return changed;
    },
    
    //
    // Turn EsriJSON into Leaflet vectors
    //
    _esriJsonGeometryToLeaflet: function(geometry, opts) {
        //
        // Create a variable for a single vector and for multi part vectors. The Google Maps API has no real support for these so we keep them in an array.
        //
        var vector, vectors;
        
        if (geometry.x && geometry.y) {
            //
            // A Point
            //
            vector = new L.Marker(new L.LatLng(geometry.y, geometry.x), opts);
        } else if (geometry.points) {
            //
            // A MultiPoint
            //
            vectors = [];
            for (var i = 0, len = geometry.points.length; i < len; i++) {
                vectors.push(new L.Marker(new L.LatLng(geometry.points[i].y, geometry.points[i].x), opts));
            }
        } else if (geometry.paths) {
            if (geometry.paths.length > 1) {
                //
                // A MultiLineString
                //
                vectors = [];
                for (var i = 0, len = geometry.paths.length; i < len; i++) {
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.paths[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.paths[i][i2][1], geometry.paths[i][i2][0]));
                    }
                    vectors.push(new L.Polyline(latlngs, opts));
                }
            } else {
                //
                // A LineString
                //
                var latlngs = [];
                for (var i = 0, len = geometry.paths[0].length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.paths[0][i][1], geometry.paths[0][i][0]));
                }
                vector = new L.Polyline(latlngs, opts);
            }
        } else if (geometry.rings) {
            if (geometry.rings.length > 1) {
                //
                // A MultiPolygon
                //
                vectors = [];
                for (var i = 0, len = geometry.rings.length; i < len; i++) {
                    var latlngss = [];
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.rings[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.rings[i][i2][1], geometry.rings[i][i2][0]));
                    }
                    latlngss.push(latlngs);
                    vectors.push(new L.Polygon(latlngss, opts));
                }
            } else {
                //
                // A Polygon
                //
                var latlngss = [];
                var latlngs = [];
                for (var i = 0, len = geometry.rings[0].length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.rings[0][i][1], geometry.rings[0][i][0]));
                }
                latlngss.push(latlngs);
                vector = new L.Polygon(latlngss, opts);
            }
        }
        return vector || vectors;
    },
    
    //
    // Convert GeoJSON to Leaflet vectors
    //
    _geoJsonGeometryToLeaflet: function(geometry, opts) {
        //
        // Create a variable for a single vector and for multi part vectors.
        //
        var vector, vectors;
        
        switch (geometry.type) {
            case "Point":
                vector = new L.Marker(new L.LatLng(geometry.coordinates[1], geometry.coordinates[0]), opts);
                break;
            
            case "MultiPoint":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    vectors.push(new L.Marker(new L.LatLng(geometry.coordinates[i][1], geometry.coordinates[i][0]), opts));
                }
                break;
                        
            case "LineString":
                var latlngs = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    latlngs.push(new L.LatLng(geometry.coordinates[i][1], geometry.coordinates[i][0]));
                }
                vector = new L.Polyline(latlngs, opts);
                break;
            
            case "MultiLineString":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++){
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++){
                        latlngs.push(new L.LatLng(geometry.coordinates[i][i2][1], geometry.coordinates[i][i2][0]));
                    }
                    vectors.push(new L.Polyline(latlngs, opts));
                }
                break;
                
            case "Polygon":
                var latlngss = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    var latlngs = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++) {
                        latlngs.push(new L.LatLng(geometry.coordinates[i][i2][1], geometry.coordinates[i][i2][0]));
                    }
                    latlngss.push(latlngs);
                }
                vector = new L.Polygon(latlngss, opts);
                break;
            
            case "MultiPolygon":
                vectors = [];
                for (var i = 0, len = geometry.coordinates.length; i < len; i++) {
                    latlngss = [];
                    for (var i2 = 0, len2 = geometry.coordinates[i].length; i2 < len2; i2++) {
                        var latlngs = [];
                        for (var i3 = 0, len3 = geometry.coordinates[i][i2].length; i3 < len3; i3++) {
                            latlngs.push(new L.LatLng(geometry.coordinates[i][i2][i3][1], geometry.coordinates[i][i2][i3][0]));
                        }
                        latlngss.push(latlngs);
                    }
                    vectors.push(new L.Polygon(latlngss, opts));
                }
                break;
                
            case "GeometryCollection":
                vectors = [];
                for (var i = 0, len = geometry.geometries.length; i < len; i++) {
                    vectors.push(this._geoJsonGeometryToGoogle(geometry.geometries[i], opts));
                }
                break;
        }
        return vector || vectors;
    },
    
    _makeJsonpRequest: function(url) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        head.appendChild(script);
    }
});
