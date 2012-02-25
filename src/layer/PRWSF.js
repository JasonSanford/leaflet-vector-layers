lvector.PRWSF = lvector.GeoJSONLayer.extend({
    initialize: function(options) {
        
        // Check for required parameters
        for (var i = 0, len = this._requiredParams.length; i < len; i++) {
            if (!options[this._requiredParams[i]]) {
                throw new Error("No \"" + this._requiredParams[i] + "\" parameter found.");
            }
        }
        
        // If the url wasn't passed with a trailing /, add it.
        if (options.url.substr(options.url.length - 1, 1) !== "/") {
            options.url += "/";
        }
        
        // Extend Layer to create PRWSF
        lvector.Layer.prototype.initialize.call(this, options);
        
        // _globalPointer is a string that points to a global function variable
        // Features returned from a JSONP request are passed to this function
        this._globalPointer = "PRWSF_" + Math.floor(Math.random() * 100000);
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
        geotable: null,
        srid: null,
        geomFieldName: "the_geom",
        fields: "",
        where: null,
        limit: null,
        uniqueField: null
    },
    
    _requiredParams: ["url", "geotable"],
    
    _getFeatures: function() {        
        
        // Build Query
        var where = this.options.where || "";
        if (!this.options.showAll) {
            var bounds = this.options.map.getBounds();
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();
            where += where.length ? " AND " : "";
            if (this.options.srid) {
                where += this.options.geomFieldName + " && transform(st_setsrid(st_makebox2d(st_point(" + sw.lng + "," + sw.lat + "),st_point(" + ne.lng + "," + ne.lat + ")),4326)," + this.options.srid + ")";
            } else {
                where += "transform(" + this.options.geomFieldName + ",4326) && st_setsrid(st_makebox2d(st_point(" + sw.lng + "," + sw.lat + "),st_point(" + ne.lng + "," + ne.lat + ")),4326)";
            }
        }
        
        // Limit returned features
        if (this.options.limit) {
            where += (where.length ? " " : "") + "limit " + this.options.limit;
        }
        
        // Build fields
        var fields = (this.options.fields.length ? this.options.fields + "," : "") + "st_asgeojson(transform(" + this.options.geomFieldName + ",4326)) as geojson";
        
        // Build URL
        var url = this.options.url + "v1/ws_geo_attributequery.php" + // The attribute query service
            "?parameters=" + encodeURIComponent(where) + // The SQL where statement
            "&geotable=" + this.options.geotable + // The table name
            "&fields=" + encodeURIComponent(fields) + //
            "&format=json" + // JSON please
            "&callback=" + this._globalPointer + "._processFeatures"; // Need this for JSONP
        
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
        var bounds = this.options.map.getBounds();
        
        // Check to see if the _lastQueriedBounds is the same as the new bounds
        // If true, don't bother querying again.
        if (this._lastQueriedBounds && this._lastQueriedBounds.equals(bounds) && !this._autoUpdateInterval) {
            return;
        }
        
        // Store the bounds in the _lastQueriedBounds member so we don't have
        // to query the layer again if someone simply turns a layer on/off
        this._lastQueriedBounds = bounds;
        
        // If "data" exists and there's more than 0 features
        if (data && parseInt(data.total_rows)) {
            
            // Loop through the returned rows
            for (var i = 0; i < data.rows.length; i++) {
            
                // Assign GeoJSON geometry to "geometry" object member
                data.rows[i].geometry = data.rows[i].row.geojson;
                
                // Remove GeoJSON geometry from "row" property list
                delete data.rows[i].row.geojson
                
                // Rename "row" property list to "properties"
                data.rows[i].properties = data.rows[i].row;
                delete data.rows[i].row;
            
                // All objects are assumed to be false until proven true (remember COPS?)
                var onMap = false;
            
                // If we have a "uniqueField" for this layer
                if (this.options.uniqueField) {
                    
                    // Loop through all of the features currently on the map
                    for (var i2 = 0; i2 < this._vectors.length; i2++) {
                    
                        // Does the "uniqueField" property for this feature match the feature on the map
                        if (data.rows[i].properties[this.options.uniqueField] == this._vectors[i2].properties[this.options.uniqueField]) {
                            // The feature is already on the map
                            onMap = true;
                            
                            // We're only concerned about updating layers that are dynamic (options.dynamic = true).
                            if (this.options.dynamic) {
                            
                                // The feature's geometry might have changed, let's check.
                                if (this._getGeometryChanged(this._vectors[i2].geometry, data.rows[i].geometry)) {
                                    
                                    // Check to see if it's a point feature, these are the only ones we're updating for now
                                    if (!isNaN(data.rows[i].geometry.coordinates[0]) && !isNaN(data.rows[i].geometry.coordinates[1])) {
                                        this._vectors[i2].geometry = data.rows[i].geometry;
                                        this._vectors[i2].vector.setPosition(new L.LatLng(this._vectors[i2].geometry.coordinates[1], this._vectors[i2].geometry.coordinates[0]));
                                    }
                                    
                                }
                                
                                var propertiesChanged = this._getPropertiesChanged(this._vectors[i2].properties, data.rows[i].properties);
                                
                                if (propertiesChanged) {
                                    this._vectors[i2].properties = data.rows[i].properties;
                                    if (this.options.infoWindowTemplate) {
                                        this._setInfoWindowContent(this._vectors[i2]);
                                    }
                                    if (this.options.symbology && this.options.symbology.type != "single") {
                                        if (this._vectors[i2].vector) {
                                            this._vectors[i2].vector.setOptions(this._getFeatureVectorOptions(this._vectors[i2]));
                                        } else if (this._vectors[i2].vectors) {
                                            for (var i3 = 0, len = this._vectors[i2].vectors.length; i3 < len; i3++) {
                                                this._vectors[i2].vectors[i3].setOptions(this._getFeatureVectorOptions(this._vectors[i2]));
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
                    
                    // Convert GeoJSON to Leaflet vector (Point, Polyline, Polygon)
                    var vector_or_vectors = this._geoJsonGeometryToLeaflet(data.rows[i].geometry, this._getFeatureVectorOptions(data.rows[i]));
                    data.rows[i][vector_or_vectors instanceof Array ? "vectors" : "vector"] = vector_or_vectors;
                    
                    // Show the vector or vectors on the map
                    if (data.rows[i].vector) {
                        this.options.map.addLayer(data.rows[i].vector);
                    } else if (data.rows[i].vectors && data.rows[i].vectors.length) {
                        for (var i3 = 0; i3 < data.rows[i].vectors.length; i3++) {
                            this.options.map.addLayer(data.rows[i].vectors[i3]);
                        }
                    }
                    
                    // Store the vector in an array so we can remove it later
                    this._vectors.push(data.rows[i]);
                    
                    if (this.options.popupTemplate) {
                        
                        var me = this;
                        var feature = data.rows[i];
                        
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
