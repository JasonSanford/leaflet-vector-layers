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
        
        this._originalOptions = L.Util.extend({}, options);
        
        if (options.esriOptions) {
            if (typeof options.esriOptions == "object") {
                L.Util.extend(options, this._convertEsriOptions(options.esriOptions));
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
                var customMarker = L.icon({
                    iconUrl: "data:" + symbol.contentType + ";base64," + symbol.imageData,
                    shadowUrl: null,
                    iconSize: new L.Point(symbol.width, symbol.height),
                    iconAnchor: new L.Point((symbol.width / 2) + symbol.xoffset, (symbol.height / 2) + symbol.yoffset),
                    popupAnchor: new L.Point(0, -(symbol.height / 2))
                });
                vectorOptions.icon = customMarker;
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
    }
    
});
