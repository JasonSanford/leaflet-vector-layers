/*
 * lvector.Layer is a base class for rendering vector layers on a Leaflet map. It's inherited by AGS, A2E, CartoDB, GeoIQ, etc.
 */

lvector.Layer = L.Class.extend({
    
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
        popupOptions: {},
        singlePopup: false,
        symbology: null,
        showAll: false
    },

    initialize: function(options) {
        L.Util.setOptions(this, options);
    },
    
    //
    // Show this layer on the map provided
    //
    setMap: function(map) {
        if (map && this.options.map) {
            return;
        }
        if (map) {
            this.options.map = map;
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
                var z = this.options.map.getZoom();
                var sr = this.options.scaleRange;
                this.options.visibleAtScale = (z >= sr[0] && z <= sr[1]);
            }
            this._show();
        } else if (this.options.map) {
            this._hide();
            this.options.map = map;
        }
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
            this.options.map.off("zoomend", this._zoomChangeListener);
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
        // TODO: There's probably an easier way to first check for "singlePopup" option then just remove the one
        //       instead of checking for "assocatedFeatures"
        for (var i = 0; i < this._vectors.length; i++) {
            if (this._vectors[i].vector) {
                this.options.map.removeLayer(this._vectors[i].vector);
                if (this._vectors[i].popup) {
                    this.options.map.removeLayer(this._vectors[i].popup);
                } else if (this.popup && this.popup.associatedFeature && this.popup.associatedFeature == this._vectors[i]) {
                    this.options.map.removeLayer(this.popup);
                    this.popup = null;
                }
            }
            if (this._vectors[i].vectors && this._vectors[i].vectors.length) {
                for (var i2 = 0; i2 < this._vectors[i].vectors.length; i2++) {
                    this.options.map.removeLayer(this._vectors[i].vectors[i2]);
                    if (this._vectors[i].vectors[i2].popup) {
                        this.options.map.removeLayer(this._vectors[i].vectors[i2].popup);
                    } else if (this.popup && this.popup.associatedFeature && this.popup.associatedFeature == this._vectors[i]) {
                        this.options.map.removeLayer(this.popup);
                        this.popup = null;
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

        me._zoomChangeListener = me._zoomChangeListenerTemplate();
        
        this.options.map.on("zoomend", me._zoomChangeListener, me);
    },

    _zoomChangeListenerTemplate: function() {
        //
        // Whenever the map's zoom changes, check the layer's visibility (this.options.visibleAtScale)
        //
        var me = this;
        return function() {
            me._checkLayerVisibility();
        }
    },

    //
    // This gets fired when the map is panned or zoomed
    //
    _idleListenerTemplate: function() {
        var me = this;
        return function() {
            if (me.options.visibleAtScale) {
                //
                // Do they use the showAll parameter to load all features once?
                //
                if (me.options.showAll) {
                    //
                    // Have we already loaded these features
                    //
                    if (!me._gotAll) {
                        //
                        // Grab the features and note that we've already loaded them (no need to _getFeatures again
                        //
                        me._getFeatures();
                        me._gotAll = true;
                    }
                } else {
                    me._getFeatures();
                }
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

        me._idleListener = me._idleListenerTemplate();
        
        //
        // Whenever the map idles (pan or zoom) get the features in the current map extent
        //
        this.options.map.on("moveend", me._idleListener, me);
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
    // Set the Popup content for the feature
    //
    _setPopupContent: function(feature) {
        //
        // Store previous Popup content so we can check to see if it changed. If it didn't no sense changing the content as this has an ugly flashing effect.
        //
        var previousContent = feature.popupContent;
        
        //
        // Esri calls them attributes. GeoJSON calls them properties.
        //
        var atts = feature.attributes || feature.properties;
        
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
        } else if (this.popup && this.popup.associatedFeature == feature) {
            // The Popup is associated with the layer (singlePopup: true)
            if (feature.popupContent !== previousContent) {
                this.popup.setContent(feature.popupContent);
            }
        }
    },
    
    //
    // Show the feature's (or layer's) Popup
    //
    _showPopup: function(feature, event) {
        //
        // Popups on Lines and Polygons are opened slightly different, make note of it
        //
        var isLineOrPolygon = event.latlng;
        
        // Set the popupAnchor if a marker was clicked
        if (!isLineOrPolygon) {
            L.Util.extend(this.options.popupOptions, {
                offset: event.target.options.icon.options.popupAnchor
            });
        }
        
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
            feature.popup = new L.Popup(this.options.popupOptions, feature.vector);
            ownsPopup = feature;
        } else {
            if (this.popup) {
                //
                // If the layer already has an Popup created, close and delete it
                //
                this.options.map.removeLayer(this.popup);
                this.popup = null;
            }
            
            //
            // Create a new Popup
            //
            this.popup = new L.Popup(this.options.popupOptions, feature.vector);
            
            //
            // Store the associated feature reference in the Popup so we can close and clear it later
            //
            this.popup.associatedFeature = feature;
            
            ownsPopup = this;
        }
        
        ownsPopup.popup.setLatLng(isLineOrPolygon ? event.latlng : event.target.getLatLng());
        ownsPopup.popup.setContent(feature.popupContent);
        this.options.map.addLayer(ownsPopup.popup);
    },

    //
    // Optional click event
    //
    _fireClickEvent: function (feature, event) {
        this.options.clickEvent(feature, event)
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
                        if (vectorOptions.title) {
                            for (var prop in atts) {
                                var re = new RegExp("{" + prop + "}", "g");
                                vectorOptions.title = vectorOptions.title.replace(re, atts[prop]);
                            }
                        }
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
                                if (vectorOptions.title) {
                                    for (var prop in atts) {
                                        var re = new RegExp("{" + prop + "}", "g");
                                        vectorOptions.title = vectorOptions.title.replace(re, atts[prop]);
                                    }
                                }
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
                                if (vectorOptions.title) {
                                    for (var prop in atts) {
                                        var re = new RegExp("{" + prop + "}", "g");
                                        vectorOptions.title = vectorOptions.title.replace(re, atts[prop]);
                                    }
                                }
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
    // Check to see if a particular property changed
    //
    _getPropertyChanged: function(oldAtts, newAtts, property) {
        return !(oldAtts[property] == newAtts[property]);
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
    
    _makeJsonpRequest: function(url) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        head.appendChild(script);
    },

    _processFeatures: function(data) {
        //
        // Sometimes requests take a while to come back and
        // the user might have turned the layer off
        //
        if (!this.options.map) {
            return;
        }
        var bounds = this.options.map.getBounds();
        
        // Check to see if the _lastQueriedBounds is the same as the new bounds
        // If true, don't bother querying again.
        if (this._lastQueriedBounds && this._lastQueriedBounds.equals(bounds) && !this.options.autoUpdate) {
            return;
        }
        
        // Store the bounds in the _lastQueriedBounds member so we don't have
        // to query the layer again if someone simply turns a layer on/off
        this._lastQueriedBounds = bounds;

        // If we don't have a uniqueField value it's hard to tell if new features are duplicates so clear them all
        featuresHaveIds = data.features && data.features.length && data.features[0].id ? true : false;
        if (!(this.options.uniqueField || featuresHaveIds)) {
            this._clearFeatures();
        }

        // If necessary, convert data to make it look like a GeoJSON FeatureCollection
        // PRWSF returns GeoJSON, but not in a FeatureCollection. Make it one.
        if (this instanceof lvector.PRWSF) {
            data.features = data.rows;
            delete data.rows;
            for (var i = 0, len = data.features.length; i < len; i++) {
                data.features[i].type = "Feature"; // Not really necessary, but let's follow the GeoJSON spec for a Feature
                data.features[i].properties = {};
                for (var prop in data.features[i].row) {
                    if (prop == "geojson") {
                        data.features[i].geometry = data.features[i].row.geojson;
                    } else {
                        data.features[i].properties[prop] = data.features[i].row[prop];
                    }
                }
                delete data.features[i].row;
            }
        }
        // GISCloud returns GeoJSON, but not in a FeatureCollection. Make it one.
        if (this instanceof lvector.GISCloud) {
            data.features = data.data;
            delete data.data;
            for (var i = 0, len = data.features.length; i < len; i++) {
                data.features[i].type = "Feature"; // Not really necessary, but let's follow the GeoJSON spec for a Feature
                data.features[i].properties = data.features[i].data;
                data.features[i].properties.id = data.features[i].__id;
                delete data.features[i].data;
                data.features[i].geometry = data.features[i].__geometry;
                delete data.features[i].__geometry;
            }
        }
        
        // If "data.features" exists and there's more than one feature in the array
        if (data && data.features && data.features.length) {
            
            // Loop through the return features
            for (var i = 0; i < data.features.length; i++) {
            
                // if AGS layer type assigned "attributes" to "properties" to keep everything looking like GeoJSON Features
                if (this instanceof lvector.EsriJSONLayer) {
                    data.features[i].properties = data.features[i].attributes;
                    delete data.features[i].attributes;
                }

                // All objects are assumed to be false until proven true (remember COPS?)
                var onMap = false,
                    featureHasId = data.features[i].id ? true : false;
            
                // If we have a "uniqueField" for this layer
                if (this.options.uniqueField || featureHasId) {
                    
                    // Loop through all of the features currently on the map
                    for (var i2 = 0; i2 < this._vectors.length; i2++) {
                        var vectorHasId = this._vectors[i2].id ? true : false;

                        // Does the "uniqueField" property for this feature match the feature on the map
                        if (
                            (featureHasId && vectorHasId && data.features[i].id == this._vectors[i2].id) ||
                            (this.options.uniqueField && data.features[i].properties[this.options.uniqueField] == this._vectors[i2].properties[this.options.uniqueField])
                        ) {
                            // The feature is already on the map
                            onMap = true;
                            
                            // We're only concerned about updating layers that are dynamic (options.dynamic = true).
                            if (this.options.dynamic) {
                            
                                // The feature's geometry might have changed, let's check.
                                if (this._getGeometryChanged(this._vectors[i2].geometry, data.features[i].geometry)) {
                                    
                                    // Check to see if it's a point feature, these are the only ones we're updating for now
                                    if (!isNaN(data.features[i].geometry.coordinates[0]) && !isNaN(data.features[i].geometry.coordinates[1])) {
                                        this._vectors[i2].geometry = data.features[i].geometry;
                                        this._vectors[i2].vector.setLatLng(new L.LatLng(this._vectors[i2].geometry.coordinates[1], this._vectors[i2].geometry.coordinates[0]));
                                    }
                                    
                                }
                                
                                var propertiesChanged = this._getPropertiesChanged(this._vectors[i2].properties, data.features[i].properties);
                                
                                if (propertiesChanged) {
                                    var symbologyPropertyChanged = this._getPropertyChanged(this._vectors[i2].properties, data.features[i].properties, this.options.symbology.property);
                                    this._vectors[i2].properties = data.features[i].properties;
                                    if (this.options.popupTemplate) {
                                        this._setPopupContent(this._vectors[i2]);
                                    }
                                    if (this.options.symbology && this.options.symbology.type != "single" && symbologyPropertyChanged) {
                                        if (this._vectors[i2].vectors) {
                                            for (var i3 = 0, len3 = this._vectors[i2].vectors.length; i3 < len3; i3++) {
                                                if (this._vectors[i2].vectors[i3].setStyle) {
                                                    // It's a LineString or Polygon, so use setStyle
                                                    this._vectors[i2].vectors[i3].setStyle(this._getFeatureVectorOptions(this._vectors[i2]));
                                                } else if (this._vectors[i2].vectors[i3].setIcon) {
                                                    // It's a Point, so use setIcon
                                                    this._vectors[i2].vectors[i3].setIcon(this._getFeatureVectorOptions(this._vectors[i2]).icon);
                                                }
                                            }
                                        } else if (this._vectors[i2].vector) {
                                            if (this._vectors[i2].vector.setStyle) {
                                                // It's a LineString or Polygon, so use setStyle
                                                this._vectors[i2].vector.setStyle(this._getFeatureVectorOptions(this._vectors[i2]));
                                            } else if (this._vectors[i2].vector.setIcon) {
                                                // It's a Point, so use setIcon
                                                this._vectors[i2].vector.setIcon(this._getFeatureVectorOptions(this._vectors[i2]).icon);
                                            }
                                        }
                                    }
                                }
                            
                            }
                            
                        }
                        
                    }
                    
                }
                
                // If the feature isn't already or the map OR the "uniqueField" attribute doesn't exist
                if (!onMap) {
                    
                    if (this instanceof lvector.GeoJSONLayer) {
                    // Convert GeoJSON to Leaflet vector (Point, Polyline, Polygon)
                        var vector_or_vectors = this._geoJsonGeometryToLeaflet(data.features[i].geometry, this._getFeatureVectorOptions(data.features[i]));
                        data.features[i][vector_or_vectors instanceof Array ? "vectors" : "vector"] = vector_or_vectors;
                    } else if (this instanceof lvector.EsriJSONLayer) {
                        // Convert Esri JSON to Google Maps vector (Point, Polyline, Polygon)
                        var vector_or_vectors = this._esriJsonGeometryToLeaflet(data.features[i].geometry, this._getFeatureVectorOptions(data.features[i]));
                        data.features[i][vector_or_vectors instanceof Array ? "vectors" : "vector"] = vector_or_vectors;
                    }
                    
                    // Show the vector or vectors on the map
                    if (data.features[i].vector) {
                        this.options.map.addLayer(data.features[i].vector);
                    } else if (data.features[i].vectors && data.features[i].vectors.length) {
                        for (var i3 = 0; i3 < data.features[i].vectors.length; i3++) {
                            this.options.map.addLayer(data.features[i].vectors[i3]);
                        }
                    }
                    
                    // Store the vector in an array so we can remove it later
                    this._vectors.push(data.features[i]);
                    
                    if (this.options.popupTemplate) {
                        
                        var me = this;
                        var feature = data.features[i];
                        
                        this._setPopupContent(feature);
                        
                        (function(feature){
                            if (feature.vector) {
                                feature.vector.on("click", function(event) {
                                    me._showPopup(feature, event);
                                });
                            } else if (feature.vectors) {
                                for (var i3 = 0, len = feature.vectors.length; i3 < len; i3++) {
                                    feature.vectors[i3].on("click", function(event) {
                                        me._showPopup(feature, event);
                                    });
                                }
                            }
                        }(feature));
                        
                    }

                    if (this.options.clickEvent) {

                        var me = this;
                        var feature = data.features[i];

                        (function(feature){
                            if (feature.vector) {
                                feature.vector.on("click", function(event) {
                                    me._fireClickEvent(feature, event);
                                });
                            } else if (feature.vectors) {
                                for (var i3 = 0, len = feature.vectors.length; i3 < len; i3++) {
                                    feature.vectors[i3].on("click", function(event) {
                                        me._fireClickEvent(feature, event);
                                    });
                                }
                            }
                        }(feature));

                    }
                
                }
                
            }
            
        }
    
    }
});
