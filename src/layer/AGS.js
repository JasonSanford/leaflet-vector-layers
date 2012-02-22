lvector.AGS = lvector.EsriJSONLayer.extend({
    initialize: function(options) {
        
        // Check for required parameters
        for (var i = 0, len = this._requiredParams.length; i < len; i++) {
            if (!options[this._requiredParams[i]]) {
                throw new Error("No \"" + this._requiredParams[i] + "\" parameter found.");
            }
        }
        
        // _globalPointer is a string that points to a global function variable
        // Features returned from a JSONP request are passed to this function
        this._globalPointer = "AGS_" + Math.floor(Math.random() * 100000);
        window[this._globalPointer] = this;
        
        // If the url wasn't passed with a trailing /, add it.
        if (options.url.substr(options.url.length - 1, 1) !== "/") {
            options.url += "/";
        }
        
        this._originalOptions = lvector.Util.extend({}, options);
        
        if (options.esriOptions) {
            if (typeof options.esriOptions == "object") {
                lvector.Util.extend(options, this._convertEsriOptions(options.esriOptions));
            } else {
                // Send to function that request JSON from server
                // Use a callback to process returned JSON and send back to initialize layer with proper options
                this._getEsriOptions();
                return; // Get out of here until we have proper JSON
            }
        }
        
        // Extend Layer to create AGS
        lvector.Layer.prototype.initialize.call(this, options);
        
        if (this.options.where) {
            this.options.where = encodeURIComponent(this.options.where);
        }
        
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
        where: "1=1",
        url: null,
        useEsriOptions: false
    },
    
    _requiredParams: ["url"],
    
    _convertEsriOptions: function(esriOptions) {
        var lvectorOptions = {};
        
        // Check to see if minScale and maxScale are present, if so conver to Google Vector Layers format
        if (!(esriOptions.minScale == undefined || esriOptions.maxScale == undefined)) {
            var minScale = this._scaleToLevel(esriOptions.minScale);
            var maxScale = this._scaleToLevel(esriOptions.maxScale);
            if (maxScale == 0) {
                maxScale = 20;
            }
            lvectorOptions.scaleRange = [minScale, maxScale];
        }
        
        // Check to see if drawingInfo and rendere are present, if so convert to Google Vector Layers format
        if (esriOptions.drawingInfo && esriOptions.drawingInfo.renderer) {
            lvectorOptions.symbology = this._renderOptionsToSymbology(esriOptions.drawingInfo.renderer);
        }
        
        // TODO: options.popupTemplate
        
        return lvectorOptions;
    },
    
    _getEsriOptions: function() {
        this._makeJsonpRequest(this._originalOptions.url + "?f=json&callback=" + this._globalPointer + "._processEsriOptions");
    },
    
    _processEsriOptions: function(data) {
        var options = this._originalOptions;
        options.esriOptions = data;
        this.initialize(options);
    },
    
    _scaleToLevel: function(scale) {
        var agsScales = [591657527.591555, 295828763.795777, 147914381.897889, 73957190.948944, 36978595.474472, 18489297.737236, 9244648.868618, 4622324.434309, 2311162.217155, 1155581.108577, 577790.554289, 288895.277144, 144447.638572, 72223.819286, 36111.909643, 18055.954822, 9027.977411, 4513.988705, 2256.994353, 1128.497176, 564.248588, 282.124294];
        if (scale == 0) {
            return 0;
        }
        var level = 0;
        for (var i = 0; i < agsScales.length - 1; i++) {
            var currentScale = agsScales[i];
            var nextScale = agsScales[i+1];
            if ((scale <= currentScale) && (scale > nextScale)) {
                level = i;
                break;
            }
        }
        return level;
    },
    
    _renderOptionsToSymbology: function(renderOptions) {
        symbology = {};
        switch (renderOptions.type) {
            case "simple":
                symbology.type = "single";
                symbology.vectorOptions = this._parseSymbology(renderOptions.symbol);
                break;
                
            case "uniqueValue":
                symbology.type = "unique";
                symbology.property = renderOptions.field1; //only support single field uniqueValues rends, rarely see multis anyway
                var values = [];
                for (var i = 0; i < renderOptions.uniqueValueInfos.length; i++) {
                    var uvi = renderOptions.uniqueValueInfos[i];
                    var value = {};
                    value.value = uvi.value;
                    value.vectorOptions = this._parseSymbology(uvi.symbol);
                    value.label = uvi.label; //not in lvector spec yet but useful
                    values.push(value);                    
                }
                symbology.values = values;
                break;
                
            case "classBreaks":
                symbology.type = "range";
                symbology.property = rend.field; 
                var ranges = [];
                var cbrk = renderOptions.minValue;
                for (var i = 0; i < renderOptions.classBreakInfos.length; i++)
                {
                    var cbi = renderOptions.classBreakInfos[i];
                    var brk = {};
                    brk.range = [cbrk, cbi.classMaxValue];
                    cbrk = cbi.classMaxValue;  //advance
                    brk.vectorOptions = this._parseSymbology(cbi.symbol);
                    brk.label = cbi.label; //not in lvector spec yet but useful
                    ranges.push(brk);                                
                }
                symbology.ranges = ranges;                
                break;
        }        
        return symbology;
    },
    
    _parseSymbology: function(symbol) {
        var vectorOptions = {};
        switch (symbol.type) {
            case "esriSMS":
            case "esriPMS":
                var customMarker = L.Icon.extend({
                    iconUrl: "data:" + symbol.contentType + ";base64," + symbol.imageData,
                    shadowUrl: null,
                    iconSize: new L.Point(symbol.width, symbol.height),
                    iconAnchor: new L.Point((symbol.width / 2) + symbol.xoffset, (symbol.height / 2) + symbol.yoffset),
                    popupAnchor: new L.Point(0, -(symbol.height / 2))
                });
                vectorOptions.icon = new customMarker();
                break;
        
            case "esriSLS":
                //we can only do solid lines in GM (true in latest build?)
                vectorOptions.weight = symbol.width;
                vectorOptions.color = this._parseColor(symbol.color);
                vectorOptions.opacity = this._parseAlpha(symbol.color[3]);
                break;
            
            case "esriSFS":
                //solid or hollow only
                if (symbol.outline) {                    
                    vectorOptions.weight = symbol.outline.width;
                    vectorOptions.color = this._parseColor(symbol.outline.color);
                    vectorOptions.opacity = this._parseAlpha(symbol.outline.color[3]);
                } else {
                    vectorOptions.weight = 0;
                    vectorOptions.color = "#000000";
                    vectorOptions.opacity = 0.0;
                }
                if (symbol.style != "esriSFSNull") {
                    vectorOptions.fillColor = this._parseColor(symbol.color);
                    vectorOptions.fillOpacity = this._parseAlpha(symbol.color[3]);                
                } else {
                    vectorOptions.fillColor = "#000000";
                    vectorOptions.fillOpacity = 0.0;                
                }
                break; 
        }
        return vectorOptions;
    },
    
    _parseColor: function(color) {
        red = this._normalize(color[0]);
        green = this._normalize(color[1]);
        blue = this._normalize(color[2]);    
        return '#' + this._pad(red.toString(16)) + this._pad(green.toString(16)) + this._pad(blue.toString(16));
    },
    
    _normalize: function(color) {
        return (color < 1.0 && color > 0.0) ? Math.floor(color * 255) : color;
    },
    
    _pad: function(s) {
        return s.length > 1 ? s.toUpperCase() : "0" + s.toUpperCase();
    },
    
    _parseAlpha: function(a) {
        // 0-255 -> 0-1.0
        return (a / 255);
    },
    
    _getFeatures: function() {
        // If we don't have a uniqueField value it's hard to tell if new features are duplicates so clear them all
        if (!this.options.uniqueField) {
            this._clearFeatures();
        }
        
        // Build URL
        var url = this.options.url + "query" + // Query this layer
            "?returnGeometry=true" + // Of course we want geometry
            "&outSR=4326" + // receive geometry in WGS 84 Lat/Lng.
            "&f=json" + // Wish it were GeoJSON, but we'll take it
            "&outFields=" + this.options.fields + // Please return the following fields
            "&where=" + this.options.where + // By default return all feature (1=1) but could pass SQL statement (value<90)
            "&callback=" + this._globalPointer + "._processFeatures"; // Need this for JSONP
        if (!this.options.showAll) {
            url += "&inSR=4326" + // request geometry in WGS 84 Lat/Lng.
            "&spatialRel=esriSpatialRelIntersects" + // Find stuff that intersects this envelope
            "&geometryType=esriGeometryEnvelope" + // Our "geometry" url param will be an envelope
            "&geometry=" + this.options.map.getBounds().toBBoxString(); // Build envelope geometry
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
                    
                        // Does the "uniqueField" attribute for this feature match the feature on the map
                        if (data.features[i].attributes[this.options.uniqueField] == this._vectors[i2].attributes[this.options.uniqueField]) {
                            // The feature is already on the map
                            onMap = true;
                            
                            // We're only concerned about updating layers that are dynamic (options.dynamic = true).
                            if (this.options.dynamic) {
                            
                                // The feature's geometry might have changed, let's check.
                                if (this._getGeometryChanged(this._vectors[i2].geometry, data.features[i].geometry)) {
                                    
                                    // Check to see if it's a point feature, these are the only ones we're updating for now
                                    if (!isNaN(data.features[i].geometry.x) && !isNaN(data.features[i].geometry.y)) {
                                        this._vectors[i2].geometry = data.features[i].geometry;
                                        this._vectors[i2].vector.setLatLng(new L.LatLng(this._vectors[i2].geometry.y, this._vectors[i2].geometry.x));
                                        if (this._vectors[i2].popup) {
                                            this._vectors[i2].popup.setLatLng(new L.LatLng(this._vectors[i2].geometry.y, this._vectors[i2].geometry.x));
                                        } else if (this.popup && this.popup.associatedFeature == this._vectors[i2]) {
                                            this.popup.setLatLng(new L.LatLng(this._vectors[i2].geometry.y, this._vectors[i2].geometry.x));
                                        }
                                    }
                                    
                                }
                                
                                var propertiesChanged = this._getPropertiesChanged(this._vectors[i2].attributes, data.features[i].attributes);
                                
                                if (propertiesChanged) {
                                    this._vectors[i2].attributes = data.features[i].attributes;
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
                    
                    // Convert Esri JSON to Google Maps vector (Point, Polyline, Polygon)
                    var vector_or_vectors = this._esriJsonGeometryToLeaflet(data.features[i].geometry, this._getFeatureVectorOptions(data.features[i]));
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
