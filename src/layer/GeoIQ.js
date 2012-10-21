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
        
    }
    
});
