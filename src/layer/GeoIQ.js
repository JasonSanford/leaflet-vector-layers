lvector.GeoIQ = lvector.GeoJSONLayer.extend({
    initialize: function(options) {
        
        // Check for required parameters
        for (var i = 0, len = this._requiredParams.length; i < len; i++) {
            if (!options[this._requiredParams[i]]) {
                throw new Error("No \"" + this._requiredParams[i] + "\" parameter found.");
            }
        }
        
        // Extend Layer to create GeoIQ
        lvector.Layer.prototype.initialize.call(this, options);
        
        // _globalPointer is a string that points to a global function variable
        // Features returned from a JSONP request are passed to this function
        this._globalPointer = "GeoIQ_" + Math.floor(Math.random() * 100000);
        window[this._globalPointer] = this;
        
        // Create an array to hold the features
        this._vectors = [];
        
        
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
                var z = this.options.map.getZoom();
                var sr = this.options.scaleRange;
                this.options.visibleAtScale = (z >= sr[0] && z <= sr[1]);
            }
            this._show();
        }
    },
    
    options: {
        dataset: null
    },
    
    _requiredParams: ["dataset"],
    
    _getFeatures: function() {
        // If we don't have a uniqueField value it's hard to tell if new features are duplicates so clear them all
        if (!this.options.uniqueField) {
            this._clearFeatures();
        }
        
        // Build URL
        var url = "http://geocommons.com/datasets/" + this.options.dataset + // Geocommons dataset ID
            "/features.json?" + // JSON please
            "geojson=1" + // Return GeoJSON formatted data
            "&callback=" + this._globalPointer + "._processFeatures" + // Need this for JSONP
            "&limit=999"; // Don't limit our results
        if (!this.options.showAll) {
            url += "&bbox=" + this.options.map.getBounds().toBBoxString() + // Build bbox geometry
                "&intersect=full"; // Return features that intersect this bbox, not just fully contained
        }
        
        // JSONP request
        this._makeJsonpRequest(url);
        
    },
    
    _processFeatures: function(data) {
        //
        // Sometimes requests take a while to come back and
        // the user might have turned the layer off
        //
        if (!this.options.map) {
            return;
        }
        data = JSON.parse(data);
        var bounds = this.options.map.getBounds();
        
        // Check to see if the _lastQueriedBounds is the same as the new bounds
        // If true, don't bother querying again.
        if (this._lastQueriedBounds && this._lastQueriedBounds.equals(bounds) && !this.options.autoUpdate) {
            return;
        }
        
        // Store the bounds in the _lastQueriedBounds member so we don't have
        // to query the layer again if someone simply turns a layer on/off
        this._lastQueriedBounds = bounds;
    
        // If "data.features" exists and there's more than one feature in the array
        if (data && data.features && data.features.length) {
            
            // Loop through the return features
            for (var i = 0; i < data.features.length; i++) {
            
                // All objects are assumed to be false until proven true (remember COPS?)
                var onMap = false;
            
                // If we have a "uniqueField" for this layer
                if (this.options.uniqueField) {
                    
                    // Loop through all of the features currently on the map
                    for (var i2 = 0; i2 < this._vectors.length; i2++) {
                    
                        // Does the "uniqueField" property for this feature match the feature on the map
                        if (data.features[i].properties[this.options.uniqueField] == this._vectors[i2].properties[this.options.uniqueField]) {
                            
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
                                    this._vectors[i2].properties = data.features[i].properties;
                                    if (this.options.popupTemplate) {
                                        this._setPopupContent(this._vectors[i2]);
                                    }
                                    if (this.options.symbology && this.options.symbology.type != "single") {
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
                if (!onMap || !this.options.uniqueField) {
                    
                    // Convert GeoJSON to Google Maps vector (Point, Polyline, Polygon)
                    var vector_or_vectors = this._geoJsonGeometryToLeaflet(data.features[i].geometry, this._getFeatureVectorOptions(data.features[i]));
                    data.features[i][vector_or_vectors instanceof Array ? "vectors" : "vector"] = vector_or_vectors;
                    
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
                
                }
                
            }
            
        }
    
    }
    
});
